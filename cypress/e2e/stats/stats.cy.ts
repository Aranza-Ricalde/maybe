import { dbQuery, loginAsE2EUser } from "../dashboard/_helpers";

const peso = (cents: number) => `$${Math.round(cents / 100).toLocaleString("es-MX")}`;

describe("Estadísticas", () => {
  beforeEach(() => {
    loginAsE2EUser();
  });

  it("abre en gasto por categoría con la leyenda, la gráfica y la tabla sincronizada", () => {
    cy.visit("/stats");
    cy.contains("h1", "Estadísticas").should("be.visible");
    cy.get('[role="img"][aria-label^="Estadísticas de"]').should("be.visible");
    cy.contains("Detalle por categoría").should("be.visible");
    cy.get('table[aria-label="Detalle por categoría"]').contains("Vivienda").should("be.visible");
  });

  it("el gasto del rango de 6 meses coincide con la base", () => {
    dbQuery<{ total: string }>(
      `select coalesce(sum(-t.amount_cents), 0) as total from transactions t join accounts a on a.id = t.account_id
       where a.family_id = 1 and t.kind = 'standard' and t.amount_cents < 0
       and t.date between (date_trunc('month', current_date) - interval '5 months')::date and current_date`,
    ).then(([row]) => {
      cy.visit("/stats");
      cy.contains("dt", "Gasto").parent().should("contain", peso(Number(row.total)));
    });
  });

  it("cambiar la métrica ajusta la agrupación y deja el estado en la dirección", () => {
    cy.visit("/stats");
    cy.contains('[role="tab"]', "Ingreso").click();
    cy.location("search").should("contain", "m=income");
    cy.contains('[role="tab"]', "Categoría").should("not.exist");
    cy.contains('[role="tab"]', "Saldo").click();
    cy.contains('[role="tab"]', "Cuenta").should("be.visible");
  });

  it("la dirección con parámetros abre la vista pedida y se puede compartir", () => {
    cy.visit("/stats?g=merchant");
    cy.contains("Detalle por comercio").should("be.visible");
    cy.visit("/stats?m=balance&proj=1");
    cy.get('[aria-label="Mostrar proyección"]').should("have.attr", "aria-checked", "true");
    cy.contains("button", "Simular escenario").should("be.visible");
  });

  it("clic en una categoría de la tabla filtra toda la vista", () => {
    cy.visit("/stats");
    cy.get('table[aria-label="Detalle por categoría"]').contains("tr", "Vivienda").click();
    cy.location("search").should("contain", "cat=");
    cy.contains("Categoría:").should("be.visible");
  });

  it("las rutas viejas de Gasto y Proyección redirigen a Estadísticas", () => {
    cy.visit("/spending");
    cy.location("pathname").should("eq", "/stats");
    cy.visit("/projection");
    cy.location("pathname").should("eq", "/stats");
    cy.location("search").should("contain", "m=balance");
  });

  it("el simulador se abre en una hoja lateral", () => {
    cy.visit("/stats?m=balance");
    cy.contains("button", "Simular escenario").click();
    cy.get('[data-slot="dialog-content"]').should("be.visible").and("contain", "Simular escenario");
  });
});
