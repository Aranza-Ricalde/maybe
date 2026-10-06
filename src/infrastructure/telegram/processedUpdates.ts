const MAX_REMEMBERED_UPDATES = 2000;

export class RecentUpdateIds {
  private readonly seen = new Set<number>();

  markIfNew(updateId: number): boolean {
    if (this.seen.has(updateId)) return false;
    this.seen.add(updateId);
    if (this.seen.size > MAX_REMEMBERED_UPDATES) {
      const oldest = this.seen.values().next().value;
      if (oldest !== undefined) this.seen.delete(oldest);
    }
    return true;
  }
}

export const processedTelegramUpdates = new RecentUpdateIds();
