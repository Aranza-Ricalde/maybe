describe("Transacciones: crear, editar, eliminar", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/transactions");
    cy.get("table").should("be.visible");
    cy.get('[data-slot="modal-backdrop"]').should("not.exist");
  });

  it("crea un movimiento con categoría y lo persiste correctamente en la base", () => {
    const name = `E2E gasto prueba ${Date.now()}`;
    cy.contains("button", "+ Registrar movimiento").click();
    cy.contains("Registrar movimiento").should("be.visible");

    cy.get('input[name="name"]').type(name);
    cy.get('input[name="amount"]').type("-123.45");
    cy.contains("span", "Categoría (opcional)").parent().find("button").click();
    cy.contains('[role="option"], li', "Transporte").click();
    cy.contains("button", "Registrar").click();

    cy.contains(name, { timeout: 10000 }).should("be.visible");

    cy.task("dbQuery", `select amount_cents, category_id from transactions where name = '${name}'`).then((rows) => {
      const row = (rows as { amount_cents: string; category_id: string }[])[0];
      expect(row, "la transacción debe existir en la base").to.exist;
      expect(Number(row.amount_cents)).to.equal(-12345);
      expect(Number(row.category_id)).to.equal(4); // Transporte
    });
  });

  it("crea un movimiento sin categoría (ingreso)", () => {
    const name = `E2E ingreso prueba ${Date.now()}`;
    cy.contains("button", "+ Registrar movimiento").click();
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="amount"]').type("777.77");
    cy.contains("button", "Registrar").click();

    cy.contains(name, { timeout: 10000 }).should("be.visible");
    cy.task("dbQuery", `select amount_cents, category_id from transactions where name = '${name}'`).then((rows) => {
      const row = (rows as { amount_cents: string; category_id: string | null }[])[0];
      expect(Number(row.amount_cents)).to.equal(77777);
      expect(row.category_id).to.be.null;
    });
  });

  it("edita un movimiento existente y el cambio persiste en la base", () => {
    const newName = `E2E editado ${Date.now()}`;
    cy.contains("Gasolina")
      .parents("tr")
      .within(() => {
        cy.get('button[aria-label="Editar movimiento"]').click();
      });
    cy.contains("Editar movimiento").should("be.visible");
    cy.get('input[name="name"]').clear().type(newName);
    cy.contains("button", "Guardar cambios").click();

    cy.contains(newName, { timeout: 10000 }).should("be.visible");
    cy.contains("Gasolina").should("not.exist");

    cy.task("dbQuery", `select name from transactions where name = '${newName}'`).then((rows) => {
      expect((rows as unknown[]).length).to.equal(1);
    });

    // revertir para no afectar otros tests que dependen de "Gasolina"
    cy.contains(newName)
      .parents("tr")
      .within(() => {
        cy.get('button[aria-label="Editar movimiento"]').click();
      });
    cy.get('input[name="name"]').clear().type("Gasolina");
    cy.contains("button", "Guardar cambios").click();
    cy.contains("Gasolina", { timeout: 10000 }).should("be.visible");
  });

  it("elimina un movimiento creado para la prueba y desaparece de la base", () => {
    const name = `E2E a borrar ${Date.now()}`;
    cy.contains("button", "+ Registrar movimiento").click();
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="amount"]').type("-10.00");
    cy.contains("button", "Registrar").click();
    cy.contains(name, { timeout: 10000 }).should("be.visible");

    cy.contains(name)
      .parents("tr")
      .within(() => {
        cy.get(`button[aria-label="Eliminar ${name}"]`).click();
      });
    cy.contains("Eliminar movimiento").should("be.visible");
    cy.contains("button", "Sí, eliminar").click();

    cy.contains(name, { timeout: 10000 }).should("not.exist");
    cy.task("dbQuery", `select id from transactions where name = '${name}'`).then((rows) => {
      expect((rows as unknown[]).length).to.equal(0);
    });
  });

  it("no permite registrar sin descripción (campo requerido)", () => {
    cy.contains("button", "+ Registrar movimiento").click();
    cy.get('input[name="amount"]').type("-10.00");
    cy.get('input[name="name"]:invalid').should("exist");
  });

  it("no permite registrar sin monto (campo requerido)", () => {
    cy.contains("button", "+ Registrar movimiento").click();
    cy.get('input[name="name"]').type("Sin monto");
    cy.get('input[name="amount"]:invalid').should("exist");
  });
});
