const MERGE_FORM = "#merge-subscriptions-form";

function accountId() {
  return cy.task("dbQuery", "select id from accounts where name = 'Nu Débito'").then((rows) => Number((rows as { id: string }[])[0].id));
}

describe("Gasto por categoría — suscripciones y comercios", () => {
  before(() => {
    accountId().then((id) => cy.task("seedSubscriptionScenario", id));
  });
  after(() => {
    cy.task("cleanupSubscriptionScenario");
  });
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/spending");
    cy.contains('[role="tab"]', /^Suscripciones/).click();
    cy.contains("Tus suscripciones").should("be.visible");
  });

  it("muestra cada servicio con su cobro mensual típico y sugiere fusionar los que cobran lo mismo en meses distintos", () => {
    cy.contains("¿Son la misma suscripción?").should("be.visible");
    cy.contains("«Xbox Game Pass» y «Xbox suscription»").should("be.visible");
    cy.contains("«Amazon Prime» y «prime video»").should("be.visible");
    cy.get('[role="checkbox"][aria-label="Elegir Xbox Game Pass para fusionar"]').closest(".items-start").should("contain", "$219 /mes");
  });

  it("fusionar con la sugerencia deja Xbox en $219/mes y recuerda la regla; deshacer la revierte", () => {
    cy.contains("form", "«Xbox Game Pass» y «Xbox suscription»").contains("button", "Sí, fusionar").click();
    cy.contains("Incluye: Xbox Game Pass, Xbox suscription").should("be.visible");
    cy.task("dbQuery", "select count(*)::int as n from subscription_aliases").then((rows) => expect((rows as { n: number }[])[0].n).to.equal(2));

    cy.contains("button", "Deshacer fusión").click();
    cy.contains("Incluye: Xbox Game Pass, Xbox suscription").should("not.exist");
    cy.task("dbQuery", "select count(*)::int as n from subscription_aliases").then((rows) => expect((rows as { n: number }[])[0].n).to.equal(0));
  });

  it("fusiona a mano Apple + Amazon Prime + prime video en una sola suscripción de $99/mes", () => {
    cy.get('[role="checkbox"][aria-label="Elegir Apple para fusionar"]').click();
    cy.get('[role="checkbox"][aria-label="Elegir Amazon Prime para fusionar"]').click();
    cy.get('[role="checkbox"][aria-label="Elegir prime video para fusionar"]').click();
    cy.get(`${MERGE_FORM} input[name="name"]`).type("Amazon Prime (vía Apple)");
    cy.get(MERGE_FORM).contains("button", "Fusionar las elegidas").click();

    cy.get('[role="checkbox"][aria-label="Elegir Amazon Prime (vía Apple) para fusionar"]').closest(".items-start").should("contain", "$99 /mes");
    cy.contains("Incluye: Amazon Prime, Apple, prime video").should("be.visible");
    cy.task("dbQuery", "select count(*)::int as n from subscription_aliases").then((rows) => expect((rows as { n: number }[])[0].n).to.equal(3));
    cy.contains("button", "Deshacer fusión").click();
  });

  it("'Comercios que más consumen' no trata como comercio lo que no tiene proveedor identificado", () => {
    cy.contains('[role="tab"]', /^Comercios/).click();
    cy.contains("Sin comercio identificado").should("be.visible");
    cy.contains("Incluye pagos a personas y descripciones libres").should("be.visible");
  });
});
