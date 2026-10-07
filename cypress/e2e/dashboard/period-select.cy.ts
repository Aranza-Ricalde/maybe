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

    cy.location("search", { timeout: 10000 }).should("include", "periods=3");

    cy.contains("sep").should("be.visible");

    // El botón vuelve a estar habilitado una vez que terminó de navegar/cargar (el estado de carga no se queda pegado).
    cy.contains("button", "Cambiar periodo").should("not.be.disabled");
  });

  it("la 'X' del popover lo cierra sin aplicar ningún cambio", () => {
    cy.visit("/");

    cy.contains("button", "Cambiar periodo").click();
    cy.contains(/Periodos/).should("be.visible");

    cy.get('[data-slot="close-button"]').click();

    cy.contains(/Periodos/).should("not.exist");
    cy.location("search").should("eq", "");
  });

  it("'Volver a la quincena actual' resetea la selección sin cerrar el popover", () => {
    cy.visit("/");

    cy.contains("button", "Cambiar periodo").click();
    cy.contains(/^Quincena 3 ·/).click();

    cy.contains("Volver a la quincena actual").click();

    // El popover sigue abierto — esto es un reset del borrador, no un cierre.
    cy.contains(/Periodos/).should("be.visible");
  });
});
