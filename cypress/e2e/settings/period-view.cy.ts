describe("Settings — Vista de periodos (quincenal o mensual)", () => {
  before(() => {
    cy.task("setPeriodView", "monthly");
  });
  after(() => {
    cy.task("setPeriodView", "monthly");
  });
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("por defecto es mensual: el selector del presupuesto lista meses y la tabla de configuración muestra meses de pago", () => {
    cy.visit("/settings");
    cy.contains('[data-slot="card-title"]', "Meses de pago").should("be.visible");
    cy.get('[aria-label="Meses de pago"]').within(() => cy.contains("Actual").should("have.length", 1));

    cy.visit("/budgets");
    cy.contains("button", "Cambiar periodo").click();
    cy.contains(/^(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre) \d{4} ·/).should("be.visible");
    cy.contains(/^Quincena \d+ ·/).should("not.exist");
    cy.contains("mes completo").should("exist");
  });

  it("al cambiar a quincenal se guarda la preferencia: el presupuesto cuenta la mitad y la configuración muestra quincenas", () => {
    cy.visit("/settings");
    cy.contains("button", "Quincenal").click();
    cy.contains("Periodos de pago").should("be.visible");
    cy.task("dbQuery", "select period_view from family_settings where family_id = 1").then((rows) => {
      expect((rows as { period_view: string }[])[0].period_view).to.equal("biweekly");
    });
    cy.visit("/budgets");
    cy.contains("una quincena").should("exist");
    cy.visit("/settings");
    cy.contains("button", "Mensual").click();
    cy.contains("Meses de pago").should("be.visible");
  });

  it("en la vista mensual se puede editar un mes sin que se traslape con el vecino", () => {
    cy.visit("/settings");
    cy.get('[aria-label="Meses de pago"]').within(() => {
      cy.get('button[aria-label^="Editar"]').first().should("be.visible");
    });
  });
});
