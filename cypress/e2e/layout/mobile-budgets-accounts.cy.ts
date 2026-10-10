export {};

const MOBILE = [390, 844] as const;
const DESKTOP = [1280, 800] as const;

describe("Presupuestos y metas / Cuentas en móvil", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("Presupuestos y Metas son pestañas: se ve una a la vez", () => {
    cy.viewport(...MOBILE);
    cy.visit("/budgets");
    cy.get('[aria-label="Lista de presupuestos"]').should("be.visible");
    cy.get('[aria-label="Metas de ahorro"]').should("not.be.visible");
    cy.contains("button", "Metas").click();
    cy.get('[aria-label="Metas de ahorro"]').should("be.visible");
    cy.get('[aria-label="Lista de presupuestos"]').should("not.be.visible");
  });

  it("en móvil el presupuesto es una lista ordenada por urgencia y las categorías sin presupuesto empiezan ocultas", () => {
    cy.viewport(...MOBILE);
    cy.visit("/budgets");
    cy.get('[aria-label="Lista de presupuestos"] li').first().should("contain", "Pasó");
    cy.get('[aria-label="Presupuesto por categoría"]').should("not.be.visible");
    cy.get('[aria-label="Categorías sin presupuesto"]').should("not.exist");
    cy.contains("button", /Sin presupuesto \(\d+\)/).click();
    cy.get('[aria-label="Categorías sin presupuesto"]').should("be.visible");
    cy.get('[aria-label="Lista de presupuestos"]').contains("button", "Alimentación").click();
    cy.contains('[role="dialog"]', "Presupuesto — Alimentación").should("be.visible");
  });

  it("el fondo de emergencia vive en Metas y las metas son una lista con avance", () => {
    cy.viewport(...MOBILE);
    cy.visit("/budgets");
    cy.get('[aria-label="Fondo de emergencia"]').should("not.be.visible");
    cy.contains("button", "Metas").click();
    cy.get('[aria-label="Fondo de emergencia"]').should("be.visible");
    cy.get('[aria-label="Lista de metas"]').should("be.visible");
    cy.get('ul[aria-label="Metas"]').should("not.be.visible");
  });

  it("en escritorio Presupuestos y Metas se ven juntos", () => {
    cy.viewport(...DESKTOP);
    cy.visit("/budgets");
    cy.get('[aria-label="Presupuesto por categoría"]').should("be.visible");
    cy.get('[aria-label="Lista de presupuestos"]').should("not.be.visible");
    cy.get('[aria-label="Metas de ahorro"]').should("be.visible");
  });

  it("las cuentas se agrupan por tipo con subtotal: Efectivo abierto y el resto plegado", () => {
    cy.viewport(...MOBILE);
    cy.visit("/accounts");
    cy.get('section[aria-label="Efectivo, ahorro y activos"]').within(() => {
      cy.get('button[aria-label="Ver detalle de Nu Débito"]').should("be.visible");
    });
    cy.get('section[aria-label="Tarjetas de crédito"]').within(() => {
      cy.get('button[aria-label="Ver detalle de Nu TDC"]').should("not.be.visible");
      cy.get("button[aria-expanded]").click();
      cy.get('button[aria-label="Ver detalle de Nu TDC"]').click();
    });
    cy.get('[role="dialog"]').should("be.visible");
  });
});
