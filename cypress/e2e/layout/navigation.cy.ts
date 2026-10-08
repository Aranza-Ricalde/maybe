const BOTTOM = 'nav[aria-label="Navegación inferior"]';
const SIDEBAR = 'nav[aria-label="Navegación principal"]';

describe("Navegación adaptable", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("en escritorio se ve el menú lateral y no la barra inferior", () => {
    cy.viewport(1280, 800);
    cy.visit("/budgets");
    cy.get(SIDEBAR).should("be.visible");
    cy.get(BOTTOM).should("not.be.visible");
    cy.get(SIDEBAR).contains("a", "Presupuestos").should("have.attr", "aria-current", "page");
  });

  it("en móvil el contenido ocupa todo el ancho: hay barra inferior de 5 destinos y no menú lateral", () => {
    cy.viewport(375, 800);
    cy.visit("/budgets");
    cy.get(SIDEBAR).should("not.exist");
    cy.get(BOTTOM).should("be.visible");
    cy.get(BOTTOM).contains("a", "Presupuestos").should("have.attr", "aria-current", "page");
    cy.get(BOTTOM).find("a, button").should("have.length", 5);
    cy.get("main").then(($main) => {
      expect($main[0].clientWidth).to.eq(375);
    });
  });

  it("la barra inferior navega entre destinos principales", () => {
    cy.viewport(375, 800);
    cy.visit("/");
    cy.get(BOTTOM).contains("a", "Movimientos").click();
    cy.location("pathname").should("eq", "/transactions");
    cy.get(BOTTOM).contains("a", "Movimientos").should("have.attr", "aria-current", "page");
  });

  it("'Más' abre una hoja con el resto de secciones y Salir, y navegar la cierra", () => {
    cy.viewport(375, 800);
    cy.visit("/budgets");
    cy.get(BOTTOM).contains("button", "Más").click();
    cy.get('[role="dialog"]').within(() => {
      ["Cuentas", "Importar estados", "Recurrentes", "Configuración", "Salir"].forEach((label) => cy.contains(label).should("be.visible"));
      cy.contains("a", "Recurrentes").click();
    });
    cy.location("pathname").should("eq", "/recurring");
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("el menú lateral se puede contraer a iconos, recuerda la elección en una cookie y la conserva al recargar", () => {
    cy.viewport(1280, 800);
    cy.visit("/budgets");
    cy.get('[data-slot="sidebar"]').should("have.attr", "data-state", "expanded");
    cy.get('[aria-label="Contraer o expandir menú"]').click();
    cy.get('[data-slot="sidebar"]').should("have.attr", "data-state", "collapsed");
    cy.getCookie("sidebar_state").should("have.property", "value", "false");
    cy.reload();
    cy.get('[data-slot="sidebar"]').should("have.attr", "data-state", "collapsed");
    cy.get('[aria-label="Contraer o expandir menú"]').click();
    cy.get('[data-slot="sidebar"]').should("have.attr", "data-state", "expanded");
  });
});
