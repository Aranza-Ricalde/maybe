import type { DeliverableNotification, NotificationChannel, PushSender, PushSubscriptionsRepository } from "@/domain/notifications/ports";

export class WebPushNotificationChannel implements NotificationChannel {
  constructor(
    private readonly subscriptions: PushSubscriptionsRepository,
    private readonly sender: PushSender,
  ) {}

  async deliver(familyId: number, notification: DeliverableNotification): Promise<void> {
    const targets = await this.subscriptions.listForFamily(familyId);
    const payload = { title: notification.title, body: notification.body, url: notification.href ?? "/", tag: notification.tag ?? notification.kind };
    await Promise.allSettled(
      targets.map(async (target) => {
        const result = await this.sender.send(target, payload);
        if (result === "gone") await this.subscriptions.remove(target.endpoint);
      }),
    );
  }
}

export class CompositeNotificationChannel implements NotificationChannel {
  constructor(private readonly channels: NotificationChannel[]) {}

  async deliver(familyId: number, notification: DeliverableNotification): Promise<void> {
    await Promise.allSettled(this.channels.map((channel) => channel.deliver(familyId, notification)));
  }
}
