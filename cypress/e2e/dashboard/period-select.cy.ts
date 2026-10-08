describe("Selector de periodo del dashboard", () => {
  before(() => {
    cy.task("setPeriodView", "biweekly");
  });
  after(() => {
    cy.task("setPeriodView", "monthly");
  });
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => {
      cy.setCookie("access_token", token as string);
    });
  });

  it("abre el popover, selecciona otra quincena, aplica, y navega con el nuevo periodo", () => {
    cy.visit("/");

    cy.contains("button", "Cambiar periodo").click();

    cy.contains(/Periodos/).should("be.visible");

    cy.contains(/^Quincena 3 ·/).click();

    cy.contains("button", "Aplicar").click();

    cy.task("dbQuery", `select id::text as value from pay_periods order by "start" offset 2 limit 1`).then((rows) => {
      const thirdPeriodId = (rows as { value: string }[])[0].value;
      cy.location("search", { timeout: 10000 }).should("include", thirdPeriodId);
    });

    cy.contains("sep").should("be.visible");

    // El botón vuelve a estar habilitado una vez que terminó de navegar/cargar (el estado de carga no se queda pegado).
    cy.contains("button", "Cambiar periodo").should("not.be.disabled");
  });

  it("Escape cierra el popover sin aplicar ningún cambio", () => {
    cy.visit("/");

    cy.contains("button", "Cambiar periodo").click();
    cy.contains(/Periodos/).should("be.visible");

    cy.get("body").type("{esc}");

    cy.contains(/Periodos/).should("not.exist");
    cy.location("search").should("eq", "");
  });

  it("'Volver al periodo actual' resetea la selección sin cerrar el popover", () => {
    cy.visit("/");

    cy.contains("button", "Cambiar periodo").click();
    cy.contains(/^Quincena 3 ·/).click();

    cy.contains("Volver al periodo actual").click();

    // El popover sigue abierto — esto es un reset del borrador, no un cierre.
    cy.contains(/Periodos/).should("be.visible");
  });
});
