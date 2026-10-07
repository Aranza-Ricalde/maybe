import type { CategoryClassifier, CategoryGuess } from "@/domain/captures/ports";
import { isApplicableGuess } from "@/domain/captures/rules";
import { classifyFlow } from "@/domain/ledger/rules";
import type { CategoriesReader } from "@/domain/readModels/ports";
import { logFailure } from "@/lib/log";

export async function guessCategory(classifier: CategoryClassifier | undefined, categories: CategoriesReader, familyId: number, description: string, amountCents: number): Promise<CategoryGuess | null> {
  if (!classifier) return null;
  try {
    const flow = classifyFlow(amountCents);
    const options = (await categories.list(familyId)).filter((category) => category.classification === flow).map(({ id, name }) => ({ id, name }));
    if (options.length === 0) return null;
    const guess = await classifier.classify({ description, amountCents, categories: options });
    return guess && isApplicableGuess(guess.confidence) && options.some((category) => category.id === guess.categoryId) ? guess : null;
  } catch (error) {
    logFailure("clasificación con IA falló", error);
    return null;
  }
}
