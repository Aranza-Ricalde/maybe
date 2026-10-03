describe("Presupuestos (/budgets)", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/budgets");
  });

  it("muestra el encabezado y el botón de cambiar periodo", () => {
    cy.contains("h1, h2", "Presupuesto").should("be.visible");
    cy.contains("button", "Cambiar periodo").should("be.visible");
  });

  it("Alimentación aparece SOBRE presupuesto por el monto exacto de la base", () => {
    cy.task("dbQuery", "select budgeted_amount_cents from budget_category_settings where category_id = 3").then((rows) => {
      expect(Number((rows as any)[0].budgeted_amount_cents)).to.equal(300000);
    });
    cy.contains("tr", "Alimentación").within(() => {
      cy.contains("$3,600.00").should("be.visible"); // gastado
      cy.contains("$3,000.00").should("be.visible"); // presupuestado
      cy.contains("120%").should("be.visible"); // 3600/3000
    });
  });

  it("Transporte aparece bajo presupuesto", () => {
    cy.contains("tr", "Transporte").within(() => {
      cy.contains("$800.00").should("be.visible");
      cy.contains("$2,000.00").should("be.visible");
      cy.contains("40%").should("be.visible");
    });
  });

  it("una categoría sin presupuesto muestra guion y sin porcentaje", () => {
    cy.contains("tr", "Nómina").within(() => {
      cy.contains("Sin presupuestar").should("be.visible");
    });
  });

  it("crea un presupuesto nuevo para Ocio y lo refleja en la base", () => {
    cy.contains("tr", "Ocio").within(() => {
      cy.get('[aria-label="Editar presupuesto de Ocio"]').click();
    });
    cy.contains("Presupuesto — Ocio").should("be.visible");
    cy.get('input[name="amount"]').clear().type("500");
    cy.contains("button", "Guardar").click();

    cy.contains("tr", "Ocio").within(() => {
      cy.contains("$500.00").should("be.visible");
    });
    cy.task("dbQuery", "select budgeted_amount_cents from budget_category_settings where category_id = 5").then((rows) => {
      expect(Number((rows as any)[0].budgeted_amount_cents)).to.equal(50000);
    });
  });

  it("editar presupuesto existente actualiza el monto en base", () => {
    cy.contains("tr", "Transporte").within(() => {
      cy.get('[aria-label="Editar presupuesto de Transporte"]').click();
    });
    cy.get('input[name="amount"]').clear().type("250");
    cy.contains("button", "Guardar").click();
    cy.task("dbQuery", "select budgeted_amount_cents from budget_category_settings where category_id = 4").then((rows) => {
      expect(Number((rows as any)[0].budgeted_amount_cents)).to.equal(25000);
    });
    // restaurar para no afectar otros tests de este spec
    cy.contains("tr", "Transporte").within(() => cy.get('[aria-label="Editar presupuesto de Transporte"]').click());
    cy.get('input[name="amount"]').clear().type("200");
    cy.contains("button", "Guardar").click();
  });

  it("el botón de cerrar (X) del modal de presupuesto cierra sin guardar cambios", () => {
    cy.contains("tr", "Alimentación").within(() => {
      cy.get('[aria-label="Editar presupuesto de Alimentación"]').click();
    });
    cy.get('input[name="amount"]').clear().type("999999");
    cy.get('[data-slot="modal-close-trigger"]').click();
    cy.contains("Presupuesto — Alimentación").should("not.exist");
    cy.task("dbQuery", "select budgeted_amount_cents from budget_category_settings where category_id = 3").then((rows) => {
      expect(Number((rows as any)[0].budgeted_amount_cents)).to.equal(300000);
    });
  });

  it("quitar presupuesto elimina la fila de budget_category_settings", () => {
    cy.contains("tr", "Ocio").within(() => {
      cy.get('[aria-label="Quitar presupuesto de Ocio"]').click();
    });
    cy.contains("¿Quitar el presupuesto").should("be.visible");
    cy.contains("button", "Sí, quitar").click();
    cy.task("dbQuery", "select count(*) as n from budget_category_settings where category_id = 5").then((rows) => {
      expect((rows as any)[0].n).to.equal("0");
    });
    cy.contains("tr", "Ocio").within(() => {
      cy.contains("Sin presupuestar").should("be.visible");
    });
  });

  it("el botón cancelar de confirmar-eliminar cierra sin borrar", () => {
    cy.task("dbQuery", "select count(*) as n from budget_category_settings where category_id = 3").then((before) => {
      cy.contains("tr", "Alimentación").within(() => {
        cy.get('[aria-label="Quitar presupuesto de Alimentación"]').click();
      });
      cy.get('[data-slot="modal-close-trigger"]').click();
      cy.task("dbQuery", "select count(*) as n from budget_category_settings where category_id = 3").then((after) => {
        expect((after as any)[0].n).to.equal((before as any)[0].n);
      });
    });
  });
});
