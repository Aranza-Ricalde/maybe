export {};

describe("Push web: manifest, service worker y suscripción", () => {
  it("el manifest y el service worker son públicos y válidos", () => {
    cy.request("/manifest.webmanifest").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.display).to.eq("standalone");
      expect(response.body.start_url).to.eq("/");
      expect(response.body.icons.length).to.be.greaterThan(1);
    });
    cy.request("/sw.js").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.contain("showNotification");
    });
    cy.request({ url: "/api/icons/192", encoding: "binary" }).its("status").should("eq", 200);
  });

  it("sin sesión no se puede guardar una suscripción", () => {
    cy.request({ method: "POST", url: "/api/push/subscribe", failOnStatusCode: false, body: { endpoint: "https://push.example.com/x", keys: { p256dh: "a".repeat(30), auth: "b".repeat(12) } } }).its("status").should("eq", 401);
  });

  it("con sesión guarda, rechaza datos inválidos y elimina la suscripción", () => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    const endpoint = "https://push.example.com/send/e2e-device";
    cy.request({ method: "POST", url: "/api/push/subscribe", failOnStatusCode: false, body: { endpoint: "http://inseguro.example.com", keys: { p256dh: "a".repeat(30), auth: "b".repeat(12) } } }).its("status").should("eq", 400);
    cy.request({ method: "POST", url: "/api/push/subscribe", body: { endpoint, keys: { p256dh: "p".repeat(30), auth: "a".repeat(12) } } }).its("status").should("eq", 200);
    cy.task("dbQuery", `select count(*)::int as n from push_subscriptions where endpoint = '${endpoint}'`).then((rows) => expect((rows as { n: number }[])[0].n).to.eq(1));
    cy.request({ method: "DELETE", url: "/api/push/subscribe", body: { endpoint } }).its("status").should("eq", 200);
    cy.task("dbQuery", `select count(*)::int as n from push_subscriptions where endpoint = '${endpoint}'`).then((rows) => expect((rows as { n: number }[])[0].n).to.eq(0));
  });

  it("Configuración muestra la sección Notificaciones con la activación para este dispositivo", () => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/settings?s=notificaciones");
    cy.contains("Este dispositivo").should("be.visible");
    cy.get('[aria-label="Notificaciones en este dispositivo"]').should("be.visible");
    cy.contains("Telegram").should("be.visible");
  });
});
