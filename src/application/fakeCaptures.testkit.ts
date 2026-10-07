import type { CaptureAccount, CaptureOutcome, CaptureRepository, CapturedTransactionView, PendingCapture } from "@/domain/captures/ports";
import { CAPTURE_SOURCES } from "@/domain/captures/rules";
import type { CategoriesReader } from "@/domain/readModels/ports";
import type { FamilyCategory } from "@/domain/readModels/types";
import type { FakeLedger } from "./fakeLedger.testkit";

export const CATEGORIES: FamilyCategory[] = [
  { id: 10, parentId: null, name: "Comida", color: "", icon: "", classification: "expense", spendingNature: null, description: null },
  { id: 11, parentId: null, name: "Transporte", color: "", icon: "", classification: "expense", spendingNature: null, description: null },
  { id: 12, parentId: null, name: "Vivienda", color: "", icon: "", classification: "expense", spendingNature: null, description: null },
  { id: 13, parentId: 12, name: "Renta", color: "", icon: "", classification: "expense", spendingNature: null, description: null },
  { id: 20, parentId: null, name: "Nómina", color: "", icon: "", classification: "income", spendingNature: null, description: null },
];

export const fakeCategoriesReader = { list: async () => CATEGORIES } as unknown as CategoriesReader;

export class FakeCaptures implements CaptureRepository {
  readonly pending = new Set<number>();
  readonly confirmed = new Set<number>();

  constructor(
    private readonly ledger: FakeLedger,
    private readonly accounts: CaptureAccount[],
  ) {}

  async listActiveAccounts() { return this.accounts; }

  async outcomeOf(transactionId: number): Promise<CaptureOutcome | null> {
    const tx = this.ledger.transactions.get(transactionId);
    if (!tx) return null;
    return { categoryId: tx.categoryId ?? null, categoryName: CATEGORIES.find((c) => c.id === tx.categoryId)?.name ?? null, merchantName: null };
  }

  async findCaptured(_familyId: number, transactionId: number): Promise<CapturedTransactionView | null> {
    const tx = this.ledger.transactions.get(transactionId);
    if (!tx || !(CAPTURE_SOURCES as readonly string[]).includes(tx.source)) return null;
    const outcome = await this.outcomeOf(transactionId);
    return {
      transactionId,
      name: tx.name,
      amountCents: tx.amountCents,
      accountName: this.accounts.find((a) => a.id === tx.accountId)?.name ?? "",
      categoryId: outcome?.categoryId ?? null,
      categoryName: outcome?.categoryName ?? null,
      merchantName: null,
      needsConfirmation: this.pending.has(transactionId),
    };
  }

  async topCategories(_familyId: number, flow: "expense" | "income", limit: number) {
    return CATEGORIES.filter((c) => c.classification === flow).slice(0, limit).map(({ id, name }) => ({ id, name }));
  }

  async markPending(_familyId: number, transactionId: number) { this.pending.add(transactionId); }
  async isPending(_familyId: number, transactionId: number) { return this.pending.has(transactionId); }
  async markConfirmed(_familyId: number, transactionId: number) { this.pending.delete(transactionId); this.confirmed.add(transactionId); }
  async listPending(): Promise<PendingCapture[]> { return []; }
}
