export {};

const MOBILE = [390, 844] as const;
const DESKTOP = [1280, 800] as const;

describe("Resumen en móvil: acciones reales, pestañas y hojas", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("el botón flotante abre el alta de movimientos", () => {
    cy.viewport(...MOBILE);
    cy.visit("/");
    cy.get('a[aria-label="Registrar movimiento"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/transactions");
    cy.contains('[role="dialog"]', "Registrar movimiento").should("be.visible");
  });

  it("los accesos directos son acciones: Transferir, Marcar pago, Importar estado y Buscar, sin repetir páginas del menú", () => {
    cy.viewport(...MOBILE);
    cy.visit("/");
    cy.get('nav[aria-label="Accesos directos"]').within(() => {
      ["Transferir", "Marcar pago", "Importar", "Buscar"].forEach((label) => cy.contains("button", label).should("be.visible"));
      ["Registrar", "Presupuestos", "Estadísticas"].forEach((label) => cy.contains(label).should("not.exist"));
    });
  });

  it("Transferir abre el formulario de transferencia sin salir del Resumen", () => {
    cy.viewport(...MOBILE);
    cy.visit("/");
    cy.get('nav[aria-label="Accesos directos"]').contains("button", "Transferir").click();
    cy.contains('[role="dialog"]', "Registrar transferencia").should("be.visible");
    cy.location("pathname").should("eq", "/");
  });

  it("Marcar pago lista los pagos pendientes con su botón", () => {
    cy.viewport(...MOBILE);
    cy.visit("/");
    cy.get('nav[aria-label="Accesos directos"]').contains("button", "Marcar pago").click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains("Marcar pago").should("be.visible");
      cy.contains("button", "Marcar pagado").should("be.visible");
    });
  });

  it("Buscar lleva a Movimientos ya filtrado por lo escrito", () => {
    cy.viewport(...MOBILE);
    cy.visit("/");
    cy.get('nav[aria-label="Accesos directos"]').contains("button", "Buscar").click();
    cy.get('input[aria-label="Buscar movimiento"]').type("Netflix{enter}");
    cy.location("pathname").should("eq", "/transactions");
    cy.location("search").should("contain", "q=Netflix");
    cy.contains("Netflix.com").should("be.visible");
    cy.contains("PAGO MI TELMEX").should("not.exist");
  });

  it("la gráfica y los últimos movimientos no estorban en móvil y Salud es la pestaña inicial", () => {
    cy.viewport(...MOBILE);
    cy.visit("/");
    cy.contains("Gasto del periodo contra tu presupuesto").should("not.be.visible");
    cy.contains("Últimos movimientos").should("not.be.visible");
    cy.get('[aria-label="Salud financiera"]').should("be.visible");
    cy.get('[aria-label="Límite mensual de gasto"]').should("not.be.visible");
    cy.contains("button", "Límite").click();
    cy.get('[aria-label="Límite mensual de gasto"]').should("be.visible");
    cy.get('[aria-label="Salud financiera"]').should("not.be.visible");
  });

  it("las decisiones siguen a la vista y los avisos viven detrás de un botón que abre una hoja", () => {
    cy.viewport(...MOBILE);
    cy.visit("/");
    cy.get('[aria-label="Pendientes"]').should("be.visible");
    cy.contains("button", "Avisos sobre tus finanzas").click();
    cy.get('[role="dialog"]').within(() => {
      cy.get("li").should("have.length.at.least", 1);
    });
  });

  it("en escritorio no hay accesos ni botón flotante, y la gráfica, los últimos movimientos y los avisos se ven completos", () => {
    cy.viewport(...DESKTOP);
    cy.visit("/");
    cy.get('a[aria-label="Registrar movimiento"]').should("not.be.visible");
    cy.get('nav[aria-label="Accesos directos"]').should("not.be.visible");
    cy.contains("Gasto del periodo contra tu presupuesto").should("be.visible");
    cy.contains("Últimos movimientos").should("be.visible");
    cy.get('[aria-label="Avisos sobre tus finanzas"]').should("be.visible");
    cy.get('[aria-label="Movimiento de dinero"]').should("be.visible");
    cy.contains("a", "+ Registrar movimiento").should("be.visible");
  });
});
