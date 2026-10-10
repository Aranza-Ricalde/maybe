export {};

const MOBILE = [390, 844] as const;
const DESKTOP = [1280, 800] as const;
const topOf = ($element?: JQuery<HTMLElement>) => $element?.get(0)?.getBoundingClientRect().top ?? 0;

describe("Recurrentes, Configuración y Estadísticas en móvil", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("en Recurrentes la lista va antes que la tarjeta de nómina", () => {
    cy.viewport(...MOBILE);
    cy.visit("/recurring");
    cy.contains("Internet Casa").then(($item) => {
      cy.contains("Configurar nómina").then(($payroll) => {
        expect(topOf($item)).to.be.lessThan(topOf($payroll));
      });
    });
  });

  it("en escritorio Recurrentes conserva el orden: nómina antes que la tabla", () => {
    cy.viewport(...DESKTOP);
    cy.visit("/recurring");
    cy.contains("Configurar nómina").then(($payroll) => {
      cy.get("table").then(($table) => {
        expect(topOf($payroll)).to.be.lessThan(topOf($table));
      });
    });
  });

  it("cada recurrente en móvil muestra su día y monto y revela sus datos y acciones al tocarlo", () => {
    cy.viewport(...MOBILE);
    cy.visit("/recurring");
    cy.contains("section h3", /Esta semana|Este mes|Próximo mes/).should("be.visible");
    cy.contains("li", "Internet Casa").within(() => {
      cy.contains("Día 5").should("be.visible");
      cy.contains("dt", "Cuenta / Categoría:").should("not.exist");
      cy.get("button[aria-expanded]").click();
      cy.contains("dt", "Cuenta / Categoría:").should("be.visible");
      cy.contains("dt", "Suma al presupuesto").should("be.visible");
      cy.get('button[aria-label^="Editar"]').should("be.visible");
    });
  });

  it("las categorías se listan compactas con Tipo en línea", () => {
    cy.viewport(...MOBILE);
    cy.visit("/settings?s=categorias");
    cy.contains("section h3", "Gastos").should("be.visible");
    cy.get("section h3").filter(":contains('Gastos')").should("have.length", 1);
    cy.contains("li", "Alimentación").within(() => {
      cy.get('button[aria-label^="Editar"]').should("be.visible");
    });
  });

  it("en Estadísticas el detalle por categoría muestra como máximo 5 filas en móvil y la tabla completa en escritorio", () => {
    cy.viewport(...MOBILE);
    cy.visit("/stats");
    cy.get('[aria-label="Detalle por categoría"] ul > li:visible').should("have.length.at.most", 5);
    cy.viewport(...DESKTOP);
    cy.visit("/stats");
    cy.get('[aria-label="Detalle por categoría"] table').should("be.visible");
  });
});
