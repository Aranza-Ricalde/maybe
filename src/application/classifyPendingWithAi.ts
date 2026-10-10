import type { CategoryClassifier } from "@/domain/captures/ports";
import type { UncategorizedTransactionsRepository } from "@/domain/categories/ports";
import { buildCategoryReviewQueue, type CategoryReviewGroup } from "@/domain/categories/reviewQueue";
import type { Flow } from "@/domain/ledger/rules";
import type { CategoriesReader } from "@/domain/readModels/ports";
import { DEBT_CATEGORY, SAVINGS_CATEGORY, plain } from "@/domain/transfers/descriptionMarkers";
import type { TransferReviewRepository } from "@/domain/transfers/ports";
import { logFailure } from "@/lib/log";
import type { CategorizeProviderUseCase } from "./categorizeProvider";

export const AI_REVIEW_TOPIC = "category_ai" as const;
export const AI_UNKNOWN_DECISION = "ai_unknown" as const;
const MAX_EXAMPLES = 40;
const MAX_GROUPS_PER_RUN = 6;
const QUEUE_SCAN_LIMIT = 500;

const isMoneyMovementCategory = (name: string) => SAVINGS_CATEGORY.test(plain(name)) || DEBT_CATEGORY.test(plain(name));

export interface AiGroupOutcome {
  providerName: string;
  flow: Flow;
  movements: number;
  categoryName?: string;
}

export interface AiClassifyReport {
  applied: AiGroupOutcome[];
  unknown: AiGroupOutcome[];
  failed: number;
}

export class ClassifyPendingWithAiUseCase {
  constructor(
    private readonly pending: UncategorizedTransactionsRepository,
    private readonly categories: Pick<CategoriesReader, "list">,
    private readonly classifier: CategoryClassifier | undefined,
    private readonly categorize: Pick<CategorizeProviderUseCase, "execute">,
    private readonly reviews: Pick<TransferReviewRepository, "listDecidedTransactionIds" | "recordDecision">,
  ) {}

  get enabled(): boolean {
    return this.classifier != null;
  }

  async execute(familyId: number, options: { apply?: boolean; maxGroups?: number; pauseMs?: number } = {}): Promise<AiClassifyReport> {
    const report: AiClassifyReport = { applied: [], unknown: [], failed: 0 };
    const classifier = this.classifier;
    if (!classifier) return report;
    const apply = options.apply ?? true;

    const [rows, ownerNames, asked, allCategories] = await Promise.all([
      this.pending.listStandardUncategorized(familyId),
      this.pending.listOwnerNames(familyId),
      this.reviews.listDecidedTransactionIds(familyId, AI_REVIEW_TOPIC, AI_UNKNOWN_DECISION),
      this.categories.list(familyId),
    ]);
    const alreadyAsked = new Set(asked);
    const groups = buildCategoryReviewQueue(rows.filter((r) => !alreadyAsked.has(r.id)), ownerNames, QUEUE_SCAN_LIMIT)
      .filter((g) => g.hint == null || g.hint.nature === "external")
      .slice(0, options.maxGroups ?? MAX_GROUPS_PER_RUN);
    if (groups.length === 0) return report;

    const examplesByFlow = new Map<Flow, Array<{ description: string; categoryName: string }>>();
    const examplesFor = async (flow: Flow) => {
      const cached = examplesByFlow.get(flow);
      if (cached) return cached;
      const known = (await this.pending.listKnownProviderCategories(familyId, flow)).slice(0, MAX_EXAMPLES);
      const examples = known.map((k) => ({ description: k.providerName, categoryName: k.categoryName }));
      examplesByFlow.set(flow, examples);
      return examples;
    };

    let first = true;
    for (const group of groups) {
      if (!first && options.pauseMs) await new Promise((resolve) => setTimeout(resolve, options.pauseMs));
      first = false;
      const categoryOptions = allCategories.filter((c) => c.classification === group.flow).map(({ id, name }) => ({ id, name }));
      if (categoryOptions.length === 0) continue;
      let guess;
      try {
        guess = await classifier.classify({
          description: describeGroup(group),
          amountCents: (group.flow === "income" ? 1 : -1) * Math.round(group.totalCents / group.count),
          categories: categoryOptions,
          knownExamples: await examplesFor(group.flow),
        });
      } catch (error) {
        logFailure("clasificación con IA de un comercio falló", error);
        report.failed++;
        continue;
      }

      const suggested = guess && guess.confidence === "high" ? categoryOptions.find((c) => c.id === guess.categoryId) : undefined;
      const category = suggested && !isMoneyMovementCategory(suggested.name) ? suggested : undefined;
      const outcome: AiGroupOutcome = { providerName: group.providerName, flow: group.flow, movements: group.count };
      if (category) {
        if (apply) {
          try {
            await this.categorize.execute(familyId, { providerId: group.providerId, flow: group.flow, hintKey: group.hintKey, decision: { categoryId: category.id } });
          } catch (error) {
            logFailure("aplicar la categoría de la IA falló", error);
            report.failed++;
            continue;
          }
        }
        report.applied.push({ ...outcome, categoryName: category.name });
      } else {
        if (apply) {
          for (const movement of group.movements) {
            if (movement.id != null) await this.reviews.recordDecision(familyId, movement.id, AI_REVIEW_TOPIC, AI_UNKNOWN_DECISION);
          }
        }
        report.unknown.push(outcome);
      }
    }
    return report;
  }
}

function describeGroup(group: CategoryReviewGroup): string {
  const names = group.sampleNames.filter((n) => n.trim().toLowerCase() !== group.providerName.trim().toLowerCase());
  return names.length > 0 ? `${group.providerName} (${names.join(" / ")})` : group.providerName;
}
