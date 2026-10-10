export {};

const MOBILE = [390, 844] as const;
const DESKTOP = [1280, 800] as const;

describe("Movimientos en móvil: buscador, filtros en hoja y filas compactas", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("el buscador está siempre a la vista y los demás filtros viven en una hoja con conteo", () => {
    cy.viewport(...MOBILE);
    cy.visit("/transactions");
    cy.get('input[placeholder="Buscar…"]').should("be.visible");
    cy.contains("button", "Cuenta").should("not.be.visible");
    cy.contains("button", /^Filtros$/).click();
    cy.contains('[role="dialog"]', "Filtros").within(() => {
      cy.contains("button", "Cuenta").click();
    });
    cy.contains('[role="option"]', "Nu TDC").click();
    cy.contains("button", "Ver resultados").click();
    cy.contains("button", "Filtros · 1").should("be.visible");
    cy.contains("Amazon").should("be.visible");
    cy.contains("PAGO MI TELMEX").should("not.exist");
  });

  it("cada fila agrupa nombre, cuenta y categoría con el monto a la derecha, sin etiqueta Monto", () => {
    cy.viewport(...MOBILE);
    cy.visit("/transactions");
    cy.contains("PAGO MI TELMEX").parents("li").first().within(() => {
      cy.contains("Nu Débito").should("be.visible");
      cy.contains("-$499.00").should("be.visible");
      cy.contains("dt", "Monto").should("not.exist");
    });
  });

  it("las acciones de una fila aparecen al tocarla y los grupos por día traen su total", () => {
    cy.viewport(...MOBILE);
    cy.visit("/transactions");
    cy.contains("PAGO MI TELMEX").parents("li").first().within(() => {
      cy.get('button[aria-label^="Editar"]').should("not.exist");
      cy.get("button[aria-expanded]").click();
      cy.get('button[aria-label^="Editar"]').should("be.visible");
    });
    cy.get("section h3").first().invoke("text").should("match", /[+−]?\$[\d,]+/);
  });

  it("los chips de fecha filtran con un toque y Ver más trae el resto sin paginación", () => {
    cy.viewport(...MOBILE);
    cy.visit("/transactions");
    cy.contains(/Mostrando 20 de \d+ movimientos/).should("be.visible");
    cy.contains("button", "Ver más").click();
    cy.contains(/Mostrando \d+ de \d+ movimientos/).should("be.visible");
    cy.get('[aria-label="Paginación"]').should("not.exist");
    cy.contains("button", /^Hoy$/).click();
    cy.contains("button", /^Hoy$/).should("have.attr", "aria-pressed", "true");
    cy.contains("button", /^Todo$/).click();
    cy.contains("PAGO MI TELMEX").should("be.visible");
  });

  it("en Movimientos no hay botón flotante, porque el alta ya está en el encabezado de la página", () => {
    cy.viewport(...MOBILE);
    cy.visit("/transactions");
    cy.contains("button", "+ Registrar movimiento").should("be.visible");
    cy.get('a[aria-label="Registrar movimiento"]').should("not.exist");
  });

  it("en escritorio los filtros siguen en línea y no hay botón Filtros", () => {
    cy.viewport(...DESKTOP);
    cy.visit("/transactions");
    cy.contains("button", "Cuenta").should("be.visible");
    cy.contains("button", /^Filtros/).should("not.be.visible");
  });
});
