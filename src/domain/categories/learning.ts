export const CATEGORY_LEARNING_MIN_SAMPLE = 5;
export const CATEGORY_LEARNING_MIN_SHARE = 0.9;
export const CATEGORY_LEARNING_UNANIMOUS_MIN_SAMPLE = 2;

export interface CategoryUsage {
  categoryId: number;
  count: number;
}

export interface LearnedCategory {
  categoryId: number;
  share: number;
  sample: number;
}

export function learnCategoryFromUsage(usage: CategoryUsage[]): LearnedCategory | null {
  const sample = usage.reduce((sum, u) => sum + u.count, 0);
  if (sample < CATEGORY_LEARNING_UNANIMOUS_MIN_SAMPLE) return null;
  const top = usage.reduce((best, u) => (u.count > best.count ? u : best), usage[0]);
  const share = top.count / sample;
  const required = sample >= CATEGORY_LEARNING_MIN_SAMPLE ? CATEGORY_LEARNING_MIN_SHARE : 1;
  if (share < required) return null;
  return { categoryId: top.categoryId, share, sample };
}
