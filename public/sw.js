self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Maybe", {
      body: data.body || "",
      tag: data.tag,
      icon: "/api/icons/192",
      badge: "/api/icons/192",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => "focus" in client);
      if (open) return open.navigate(target).then((client) => client && client.focus());
      return self.clients.openWindow(target);
    }),
  );
});
