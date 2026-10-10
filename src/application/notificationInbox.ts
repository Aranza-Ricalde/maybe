import type { NotificationsRepository, StoredNotification } from "@/domain/notifications/ports";

const INBOX_LIMIT = 30;

export interface NotificationInboxView {
  items: StoredNotification[];
  unreadCount: number;
}

export class NotificationInbox {
  constructor(private readonly repository: NotificationsRepository) {}

  async view(familyId: number): Promise<NotificationInboxView> {
    const [items, unreadCount] = await Promise.all([this.repository.listInbox(familyId, INBOX_LIMIT), this.repository.countUnread(familyId)]);
    return { items, unreadCount };
  }

  markRead(familyId: number, id: number): Promise<void> {
    return this.repository.markRead(familyId, id);
  }

  dismiss(familyId: number, id: number): Promise<void> {
    return this.repository.dismiss(familyId, id);
  }

  markAllRead(familyId: number): Promise<void> {
    return this.repository.markAllRead(familyId);
  }

  dismissAll(familyId: number): Promise<void> {
    return this.repository.dismissAll(familyId);
  }
}
