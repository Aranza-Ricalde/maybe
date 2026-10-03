describe("Settings — Conceptos", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/settings");
  });

  it("lista los 3 conceptos sembrados con categoría y proveedor correctos vs. la base", () => {
    cy.task(
      "dbQuery",
      "select c.name, cat.name as category_name, p.name as provider_name, c.flow from concepts c join categories cat on cat.id = c.category_id left join providers p on p.id = c.provider_id order by c.id",
    ).then((rows) => {
      const dbRows = rows as { name: string; category_name: string; provider_name: string | null; flow: string }[];
      expect(dbRows.map((r) => r.name)).to.deep.equal(["Internet Casa", "Luz", "Netflix"]);

      for (const row of dbRows) {
        cy.contains("tr", row.name).within(() => {
          cy.contains(row.category_name).should("be.visible");
          cy.contains(row.provider_name ?? "—").should("be.visible");
          cy.contains(row.flow === "income" ? "Ingreso" : "Gasto").should("be.visible");
        });
      }
    });
  });

  it("crea un concepto nuevo con categoría y proveedor, lo edita, y lo elimina", () => {
    const name = `E2E Concepto ${Date.now()}`;
    const renamed = `${name} editado`;

    cy.contains("button", "+ Nuevo concepto").click();
    cy.contains("Nuevo concepto").should("be.visible");
    cy.get('input[name="name"]').type(name);
    cy.get('[aria-label="Categoría"]').click();
    cy.contains('[role="option"], li', "Alimentación").click();
    cy.get('[aria-label="Proveedor (opcional)"]').click();
    cy.contains('[role="option"], li', "CFE").click();
    cy.contains("button", "Crear concepto").click();
    cy.contains("Nuevo concepto").should("not.exist");

    cy.contains("tr", name).within(() => {
      cy.contains("Alimentación").should("be.visible");
      cy.contains("CFE").should("be.visible");
    });
    cy.task(
      "dbQuery",
      `select cat.name as category_name, p.name as provider_name from concepts c join categories cat on cat.id = c.category_id left join providers p on p.id = c.provider_id where c.name = '${name}'`,
    ).then((rows) => {
      const row = (rows as { category_name: string; provider_name: string }[])[0];
      expect(row.category_name).to.equal("Alimentación");
      expect(row.provider_name).to.equal("CFE");
    });

    // Editar: renombrar y quitar el proveedor (dejarlo "Sin proveedor").
    cy.contains("tr", name).within(() => cy.get('button[aria-label="Editar concepto"]').click());
    cy.get('input[name="name"]').clear().type(renamed);
    cy.get('[aria-label="Proveedor (opcional)"]').click();
    cy.contains('[role="option"], li', "Sin proveedor").click();
    cy.contains("button", "Guardar cambios").click();

    cy.contains("tr", renamed).within(() => cy.contains("—").should("be.visible"));
    cy.task("dbQuery", `select provider_id from concepts where name = '${renamed}'`).then((rows) => {
      expect((rows as { provider_id: number | null }[])[0].provider_id).to.be.null;
    });

    cy.contains("tr", renamed).within(() => cy.get(`button[aria-label="Eliminar ${renamed}"]`).click());
    cy.contains("button", "Sí, eliminar").click();
    cy.contains("tr", renamed).should("not.exist");
    cy.task("dbQuery", `select count(*) as n from concepts where name = '${renamed}'`).then((rows) => {
      expect((rows as { n: string }[])[0].n).to.equal("0");
    });
  });

  it("el selector de 'Tipo' (flow) solo aparece al crear, no al editar", () => {
    cy.contains("button", "+ Nuevo concepto").click();
    cy.get('[aria-label="Tipo"]').should("exist");
    cy.get('[data-slot="modal-close-trigger"]').click();

    cy.contains("tr", "Internet Casa").within(() => cy.get('button[aria-label="Editar concepto"]').click());
    cy.get('[aria-label="Tipo"]').should("not.exist");
    cy.get('[data-slot="modal-close-trigger"]').click();
  });

  it("el botón de cerrar (X) del modal de nuevo concepto cierra sin crear nada", () => {
    cy.task("dbQuery", "select count(*) as n from concepts").then((before) => {
      const countBefore = (before as { n: string }[])[0].n;
      cy.contains("button", "+ Nuevo concepto").click();
      cy.get('input[name="name"]').type("No debería guardarse");
      cy.get('[data-slot="modal-close-trigger"]').click();
      cy.contains("Nuevo concepto").should("not.exist");
      cy.task("dbQuery", "select count(*) as n from concepts").then((after) => {
        expect((after as { n: string }[])[0].n).to.equal(countBefore);
      });
    });
  });
});
