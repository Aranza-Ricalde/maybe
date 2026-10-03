describe("Settings — Proveedores", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/settings");
  });

  it("lista los 3 proveedores sembrados (Telmex, CFE, Netflix) vs. la base", () => {
    cy.task("dbQuery", "select name from providers order by id").then((rows) => {
      const names = (rows as { name: string }[]).map((r) => r.name);
      expect(names).to.deep.equal(["Telmex", "CFE", "Netflix"]);
      for (const name of names) {
        cy.contains("tr", name).should("be.visible");
      }
    });
  });

  it("crea, edita (renombra) y elimina un proveedor, verificando cada paso contra la base", () => {
    const name = `E2E Provider ${Date.now()}`;
    const renamed = `${name} renombrado`;

    cy.contains("button", "+ Nuevo proveedor").click();
    cy.contains("Nuevo proveedor").should("be.visible");
    cy.get('input[name="name"]').type(name);
    cy.contains("button", "Crear proveedor").click();
    cy.contains("Nuevo proveedor").should("not.exist");
    cy.contains("tr", name).should("be.visible");
    cy.task("dbQuery", `select count(*) as n from providers where name = '${name}'`).then((rows) => {
      expect((rows as { n: string }[])[0].n).to.equal("1");
    });

    cy.contains("tr", name).within(() => cy.get('button[aria-label="Editar proveedor"]').click());
    cy.get('input[name="name"]').clear().type(renamed);
    cy.contains("button", "Guardar cambios").click();
    cy.contains("tr", renamed).should("be.visible");
    cy.contains("tr", name).should("not.exist");
    cy.task("dbQuery", `select count(*) as n from providers where name = '${renamed}'`).then((rows) => {
      expect((rows as { n: string }[])[0].n).to.equal("1");
    });

    cy.contains("tr", renamed).within(() => cy.get(`button[aria-label="Eliminar ${renamed}"]`).click());
    cy.contains("button", "Sí, eliminar").click();
    cy.contains("tr", renamed).should("not.exist");
    cy.task("dbQuery", `select count(*) as n from providers where name = '${renamed}'`).then((rows) => {
      expect((rows as { n: string }[])[0].n).to.equal("0");
    });
  });

  it("eliminar un proveedor EN USO (Telmex, usado por el concepto Internet Casa) no falla, y el concepto queda sin proveedor (ON DELETE SET NULL) — luego se restaura la relación", () => {
    cy.task("dbQuery", "select provider_id from concepts where name = 'Internet Casa'").then((before) => {
      const providerIdBefore = (before as { provider_id: number }[])[0].provider_id;
      expect(providerIdBefore).to.not.be.null;

      cy.contains("tr", "Telmex").within(() => cy.get('button[aria-label="Eliminar Telmex"]').click());
      cy.contains(/Los conceptos y patrones de comercio/).should("be.visible");
      cy.contains("button", "Sí, eliminar").click();
      cy.contains("tr", "Telmex").should("not.exist");

      cy.task("dbQuery", "select provider_id from concepts where name = 'Internet Casa'").then((afterRows) => {
        expect((afterRows as { provider_id: number | null }[])[0].provider_id).to.be.null;

        // Restauramos: recreamos "Telmex" y volvemos a ligarlo al concepto Internet Casa,
        // para no dejar el fixture compartido roto para otros tests/áreas.
        cy.contains("button", "+ Nuevo proveedor").click();
        cy.get('input[name="name"]').type("Telmex");
        cy.contains("button", "Crear proveedor").click();
        cy.contains("tr", "Telmex").should("be.visible");

        cy.contains("tr", "Internet Casa").within(() => cy.get('button[aria-label="Editar concepto"]').click());
        cy.get('[aria-label="Proveedor (opcional)"]').click();
        cy.contains('[role="option"], li', "Telmex").click();
        cy.contains("button", "Guardar cambios").click();

        cy.task("dbQuery", "select p.name from concepts c join providers p on p.id = c.provider_id where c.name = 'Internet Casa'").then((restored) => {
          expect((restored as { name: string }[])[0]?.name).to.equal("Telmex");
        });
      });
    });
  });

  it("el botón de cerrar (X) del modal de nuevo proveedor cierra sin crear nada", () => {
    cy.task("dbQuery", "select count(*) as n from providers").then((before) => {
      const countBefore = (before as { n: string }[])[0].n;
      cy.contains("button", "+ Nuevo proveedor").click();
      cy.get('input[name="name"]').type("No debería guardarse");
      cy.get('[data-slot="modal-close-trigger"]').click();
      cy.contains("Nuevo proveedor").should("not.exist");
      cy.task("dbQuery", "select count(*) as n from providers").then((after) => {
        expect((after as { n: string }[])[0].n).to.equal(countBefore);
      });
    });
  });
});
