describe("Recurrentes: nómina", () => {
  const cleanup = () => cy.task("cleanupPayroll");
  const toast = (text: string) => cy.contains("[data-sonner-toast]", text, { timeout: 10000 }).should("be.visible");

  beforeEach(() => {
    cleanup();
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/recurring");
  });

  after(() => {
    cleanup();
  });

  it("por defecto se ancla al inicio de cada periodo y muestra los cobros reales de los periodos", () => {
    cy.contains("button", "Configurar nómina").click();
    cy.get('input[name="estimatedAmount"]').type("15000");

    cy.task("dbQuery", `select to_char("start", 'FMDD') as value from pay_periods where "start" >= current_date order by "start" limit 3`).then((rows) => {
      const days = (rows as { value: string }[]).map((row) => row.value);
      cy.contains("Próximos cobros:").parent().invoke("text").then((text) => days.forEach((day) => expect(text).to.contain(day)));
    });

    cy.contains('[role="dialog"] button', "Guardar nómina").click();
    toast("Nómina guardada");
    cy.contains("Configurada").should("be.visible");

    cy.task("dbQuery", "select name, day_of_month, estimated_amount_cents, flow from recurring_items where name like 'Nómina%'").then((rows) => {
      const list = rows as { name: string; day_of_month: number; estimated_amount_cents: string; flow: string }[];
      expect(list).to.have.length(1);
      expect(list[0].name).to.equal("Nómina");
      expect(list[0].day_of_month).to.equal(0);
      expect(list[0].flow).to.equal("income");
      expect(Number(list[0].estimated_amount_cents)).to.equal(1500000);
    });
    cy.contains("Inicio de cada periodo").should("be.visible");
  });

  it("la nómina no aparece en el calendario de pagos del resumen ni como tarjeta de próximos cobros en Recurrentes", () => {
    cy.contains("button", "Configurar nómina").click();
    cy.get('input[name="estimatedAmount"]').type("15000");
    cy.contains('[role="dialog"] button', "Guardar nómina").click();
    toast("Nómina guardada");
    cy.get("main, [data-slot=sidebar-inset]").should("not.contain", "Próximos cobros");

    cy.visit("/");
    cy.contains("Calendario del periodo").should("be.visible");
    cy.contains("[data-slot=card]", "Calendario del periodo").should("not.contain", "Nómina");
  });

  it("al editar a pago mensual con un día elegido reemplaza la nómina anclada sin duplicarla", () => {
    cy.contains("button", "Configurar nómina").click();
    cy.get('input[name="estimatedAmount"]').type("15000");
    cy.contains('[role="dialog"] button', "Guardar nómina").click();
    toast("Nómina guardada");

    cy.contains("button", "Editar nómina").click();
    cy.contains("label", "Mensual").click();
    cy.get('input[name="payrollFirstDay"]').clear().type("5");
    cy.contains('[role="dialog"] button', "Actualizar nómina").click();
    cy.contains("mensual · cobras el día 5", { timeout: 10000 }).should("be.visible");

    cy.task("dbQuery", "select name, day_of_month from recurring_items where name like 'Nómina%'").then((rows) => {
      const list = rows as { name: string; day_of_month: number }[];
      expect(list).to.have.length(1);
      expect(list[0]).to.deep.equal({ name: "Nómina", day_of_month: 5 });
    });
  });

  it("si no hay nada que guardar bien, avisa del error y deja abierto el formulario", () => {
    cy.contains("button", "Configurar nómina").click();
    cy.contains("label", "Mensual").click();
    cy.get('input[name="estimatedAmount"]').type("15000");
    cy.get('input[name="payrollFirstDay"]').clear().invoke("val", "40");
    cy.contains('[role="dialog"] button', "Guardar nómina").click();
    cy.get('[role="dialog"]').should("be.visible");
  });
});
