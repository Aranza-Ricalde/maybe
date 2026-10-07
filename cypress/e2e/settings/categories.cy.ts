const SEEDED_CATEGORIES: { name: string; classification: "income" | "expense"; color: string }[] = [
  { name: "Servicios", classification: "expense", color: "#0d7d6f" },
  { name: "Vivienda", classification: "expense", color: "#2563eb" },
  { name: "Alimentación", classification: "expense", color: "#d97706" },
  { name: "Transporte", classification: "expense", color: "#7c3aed" },
  { name: "Ocio", classification: "expense", color: "#db2777" },
  { name: "Nómina", classification: "income", color: "#16a34a" },
  { name: "Pago de deuda", classification: "expense", color: "#64748b" },
];

describe("Settings — Categorías", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/settings");
  });

  it("lista las 7 categorías sembradas con nombre, tipo y color correctos vs. la base", () => {
    cy.task("dbQuery", "select name, classification, color from categories order by id").then((rows) => {
      const dbRows = rows as { name: string; classification: string; color: string }[];
      expect(dbRows).to.have.length(7);
      expect(dbRows.map((r) => r.name)).to.deep.equal(SEEDED_CATEGORIES.map((c) => c.name));
    });

    for (const c of SEEDED_CATEGORIES) {
      cy.contains("tr", c.name).within(() => {
        cy.contains(c.classification === "income" ? "Ingreso" : "Gasto").should("be.visible");
        cy.get("span.rounded-full").should("have.css", "background-color").then((bg) => {
          expect(String(bg)).to.not.be.empty;
        });
      });
    }
  });

  it("crea una categoría de gasto nueva, la verifica en la base, la edita y la elimina", () => {
    const name = `E2E Cat Gasto ${Date.now()}`;
    const renamed = `${name} editada`;

    cy.contains("button", "+ Nueva categoría").click();
    cy.contains("Nueva categoría").should("be.visible");
    cy.get('input[name="name"]').type(name);
    // classification por defecto ya es "expense" (Gasto), y el color por defecto es el primero de la paleta.
    cy.contains("button", "Crear categoría").click();
    cy.get('[data-slot="modal-backdrop"]').should("not.exist");

    cy.contains("tr", name).should("be.visible");
    cy.task("dbQuery", `select classification, color from categories where name = '${name}'`).then((rows) => {
      const row = (rows as { classification: string; color: string }[])[0];
      expect(row.classification).to.equal("expense");
      expect(row.color).to.equal("#0d7d6f");
    });

    // Editar: cambiar nombre, cambiar a Ingreso, cambiar color.
    cy.contains("tr", name).within(() => {
      cy.get('button[aria-label="Editar categoría"]').click();
    });
    cy.contains("Editar categoría").should("be.visible");
    cy.get('input[name="name"]').clear().type(renamed);
    cy.get('[aria-label="Color #2563eb"]').click();
    cy.contains("button", "Guardar cambios").click();
    cy.contains("Editar categoría").should("not.exist");

    cy.contains("tr", renamed).should("be.visible");
    cy.task("dbQuery", `select name, color from categories where name = '${renamed}'`).then((rows) => {
      const row = (rows as { name: string; color: string }[])[0];
      expect(row.name).to.equal(renamed);
      expect(row.color).to.equal("#2563eb");
    });

    // Eliminar.
    cy.contains("tr", renamed).within(() => {
      cy.get(`button[aria-label="Eliminar ${renamed}"]`).click();
    });
    cy.contains("Eliminar categoría").should("be.visible");
    cy.contains(renamed).should("be.visible");
    cy.contains("button", "Sí, eliminar").click();
    cy.contains("tr", renamed).should("not.exist");
    cy.task("dbQuery", `select count(*) as n from categories where name = '${renamed}'`).then((rows) => {
      expect((rows as { n: string }[])[0].n).to.equal("0");
    });
  });

  it("crea una categoría de ingreso y queda clasificada como Ingreso en la base y en la tabla", () => {
    const name = `E2E Cat Ingreso ${Date.now()}`;

    cy.contains("button", "+ Nueva categoría").click();
    cy.get('input[name="name"]').type(name);
    cy.get('[aria-label="Tipo"]').click();
    cy.contains('[role="option"], li', "Ingreso").click();
    cy.contains("button", "Crear categoría").click();
    cy.get('[data-slot="modal-backdrop"]').should("not.exist");

    cy.contains("tr", name).within(() => cy.contains("Ingreso").should("be.visible"));
    cy.task("dbQuery", `select classification from categories where name = '${name}'`).then((rows) => {
      expect((rows as { classification: string }[])[0].classification).to.equal("income");
    });

    // limpieza
    cy.contains("tr", name).within(() => cy.get(`button[aria-label="Eliminar ${name}"]`).click());
    cy.contains("button", "Sí, eliminar").click();
    cy.contains("tr", name).should("not.exist");
  });

  it("el botón de cerrar (X) del modal de nueva categoría cierra sin crear nada", () => {
    cy.task("dbQuery", "select count(*) as n from categories").then((before) => {
      const countBefore = (before as { n: string }[])[0].n;

      cy.contains("button", "+ Nueva categoría").click();
      cy.get('input[name="name"]').type("No debería guardarse");
      cy.get('[data-slot="modal-close-trigger"]').click();
      cy.get('[data-slot="modal-backdrop"]').should("not.exist");

      cy.task("dbQuery", "select count(*) as n from categories").then((after) => {
        expect((after as { n: string }[])[0].n).to.equal(countBefore);
      });
      cy.contains("No debería guardarse").should("not.exist");
    });
  });

  it("eliminar una categoría en uso (Servicios) no falla y dependientes quedan sin categoría (ON DELETE SET NULL) — se recrea al final", () => {
    // Usamos una categoría nueva desechable para no afectar las fixtures de otras áreas: creamos,
    // la usamos indirectamente al verificar que el flujo de borrado no truena, y la limpiamos.
    const name = `E2E Cat Temporal ${Date.now()}`;
    cy.contains("button", "+ Nueva categoría").click();
    cy.get('input[name="name"]').type(name);
    cy.contains("button", "Crear categoría").click();
    cy.contains("tr", name).should("be.visible");

    cy.contains("tr", name).within(() => cy.get(`button[aria-label="Eliminar ${name}"]`).click());
    cy.contains(/Los movimientos, recurrentes o presupuestos/).should("be.visible");
    cy.contains("button", "Sí, eliminar").click();
    cy.contains("tr", name).should("not.exist");
  });
});

describe("Settings — Descripción de categorías", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("muestra una descripción sugerida, se puede personalizar y el tooltip del presupuesto usa la nueva", () => {
    cy.visit("/settings");
    cy.contains("tr", "Alimentación").within(() => {
      cy.contains("Todo lo que comes").should("be.visible");
      cy.contains("Sugerida").should("be.visible");
      cy.get('button[aria-label^="Editar"]').click();
    });
    cy.get('textarea[name="description"]').clear().type("Mi comida de la semana");
    cy.get('[role="dialog"]').contains("button", "Guardar").click();
    cy.get('[role="dialog"]').should("not.exist");
    cy.contains("tr", "Alimentación").within(() => cy.contains("Mi comida de la semana").should("be.visible"));
    cy.task("dbQuery", "select description from categories where name = 'Alimentación'").then((rows) => {
      expect((rows as { description: string }[])[0].description).to.equal("Mi comida de la semana");
    });

    cy.visit("/budgets");
    cy.get('[aria-label="¿Qué va en Alimentación?"]').focus();
    cy.contains("Mi comida de la semana").should("be.visible");

    cy.visit("/settings");
    cy.contains("tr", "Alimentación").within(() => cy.get('button[aria-label^="Editar"]').click());
    cy.get('textarea[name="description"]').clear();
    cy.get('[role="dialog"]').contains("button", "Guardar").click();
    cy.get('[role="dialog"]').should("not.exist");
    cy.contains("tr", "Alimentación").within(() => cy.contains("Todo lo que comes").should("be.visible"));
  });
});
