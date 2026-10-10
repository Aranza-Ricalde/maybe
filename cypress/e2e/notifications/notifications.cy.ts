export {};

const generate = () =>
  cy.task("cronSecret").then((secret) =>
    cy.request({ method: "GET", url: "/api/cron/notifications", headers: { authorization: `Bearer ${secret as string}` } }),
  );

const unread = () => cy.task("dbQuery", "select count(*)::int as n from notification_events where read_at is null and dismissed_at is null").then((rows) => (rows as { n: number }[])[0].n);

describe("Notificaciones: generación, campana y limpieza", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("sin el secreto del cron responde 401", () => {
    cy.request({ method: "GET", url: "/api/cron/notifications", failOnStatusCode: false }).its("status").should("eq", 401);
  });

  it("generar dos veces no duplica avisos", () => {
    generate().its("status").should("eq", 200);
    unread().then((first) => {
      expect(first).to.be.greaterThan(0);
      generate().its("status").should("eq", 200);
      unread().should("eq", first);
    });
  });

  it("la campana lista los avisos, permite marcar como leído y eliminar, y desaparecen", () => {
    generate();
    cy.visit("/");
    cy.get('button[aria-label^="Notificaciones"]:visible').first().click();
    cy.get('[role="dialog"]').within(() => {
      cy.get('ul[aria-label="Notificaciones"] > li').its("length").then((total) => {
        expect(total).to.be.greaterThan(1);
        cy.get('ul[aria-label="Notificaciones"] > li').first().find('button[aria-label^="Eliminar"]').click();
        cy.get('ul[aria-label="Notificaciones"] > li').should("have.length", total - 1);
        cy.contains("button", "Marcar todas como leídas").click();
        cy.contains("Estás al día").should("be.visible");
      });
    });
    cy.contains("Notificaciones marcadas como leídas").should("be.visible");
    cy.reload();
    cy.get('button[aria-label="Notificaciones"]:visible').should("exist");
    unread().should("eq", 0);
  });

  it("al volver a generar, lo ya leído o eliminado no reaparece", () => {
    generate();
    unread().should("eq", 0);
  });
});
