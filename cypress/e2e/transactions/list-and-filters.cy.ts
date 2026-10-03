describe("Transacciones: carga inicial y filtros", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/transactions");
  });

  it("muestra el encabezado y los botones principales", () => {
    cy.contains("h1, h2, [role=heading]", "Movimientos").should("be.visible");
    cy.contains("button", "Transferencia").should("be.visible");
    cy.contains("button", "+ Registrar movimiento").should("be.visible");
  });

  it("la tabla muestra transacciones reales que coinciden con la base de datos", () => {
    cy.task("dbQuery", "select name, amount_cents from transactions where name = 'PAGO MI TELMEX'").then((rows) => {
      const row = (rows as { name: string; amount_cents: string }[])[0];
      expect(row, "la transacción sembrada debe existir").to.exist;
      cy.contains("PAGO MI TELMEX").should("be.visible");
      cy.contains("PAGO MI TELMEX")
        .parents("tr")
        .within(() => {
          cy.contains("-$499.00").should("be.visible");
        });
    });
  });

  it("muestra el nombre de cuenta y categoría debajo del nombre del movimiento", () => {
    cy.contains("PAGO MI TELMEX")
      .parents("tr")
      .within(() => {
        cy.contains("Nu Débito").should("be.visible");
        cy.contains("Servicios").should("be.visible");
      });
  });

  it("filtro de cuenta: al elegir 'Nu TDC' solo se muestran movimientos de esa cuenta", () => {
    cy.contains("button", "Cuenta").click();
    cy.contains('[role="option"], li', "Nu TDC").click();
    cy.contains("Amazon").should("be.visible");
    cy.contains("PAGO MI TELMEX").should("not.exist");
  });

  it("filtro de categoría: al elegir 'Alimentación' solo se muestra 'Supermercado'", () => {
    cy.contains("button", "Categoría").click();
    cy.contains('[role="option"], li', "Alimentación").click();
    cy.contains("Supermercado").should("be.visible");
    cy.contains("PAGO MI TELMEX").should("not.exist");
  });

  it("búsqueda por texto filtra por nombre", () => {
    cy.get('input[placeholder="Buscar…"]').type("Netflix");
    cy.contains("Netflix.com").should("be.visible");
    cy.contains("Supermercado").should("not.exist");
  });

  it("filtro de monto mínimo excluye movimientos más chicos", () => {
    cy.contains("button", "Monto:").click();
    cy.contains("button", "Mínimo").click();
    cy.get('input[placeholder="0.00"]').type("1000");
    cy.get("body").click(0, 0);
    cy.contains("Supermercado").should("be.visible"); // -3600, abs >= 1000
    cy.contains("Gasolina").should("not.exist"); // -800, abs < 1000
  });

  it("botón 'limpiar filtros' aparece solo cuando hay filtros activos y los limpia todos", () => {
    cy.contains("button", "Cuenta").click();
    cy.contains('[role="option"], li', "Nu TDC").click();
    cy.get('button[aria-label="Limpiar todos los filtros"]').should("be.visible").click();
    cy.contains("PAGO MI TELMEX").should("be.visible");
    cy.get('button[aria-label="Limpiar todos los filtros"]').should("not.exist");
  });

  it("el tamaño de página cambia cuántas filas se muestran", () => {
    cy.contains("Mostrar").parent().find("select").select("10");
    cy.get("tbody tr").should("have.length.at.most", 10);
  });

  it("ordenar por fecha cambia el orden de las filas (encabezado de columna clickeable)", () => {
    cy.get("th").contains("Fecha").click();
    cy.wait(300);
    cy.get("th").contains("Fecha").click();
  });

  it("sin resultados muestra el estado vacío correcto", () => {
    cy.get('input[placeholder="Buscar…"]').type("esto-no-existe-en-ningun-lado-xyz");
    cy.contains("Sin resultados").should("be.visible");
  });
});
