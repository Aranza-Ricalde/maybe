const NETFLIX_RECURRING_CENTS = 22900;

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function monthlyShareCents(amountCents: number, start: string, end: string): number {
  const daysByMonth = new Map<string, number>();
  for (let d = new Date(`${start}T00:00:00Z`); d <= new Date(`${end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    const month = d.toISOString().slice(0, 7);
    daysByMonth.set(month, (daysByMonth.get(month) ?? 0) + 1);
  }
  let fraction = 0;
  for (const [month, days] of daysByMonth) {
    const [year, monthNumber] = month.split("-").map(Number);
    fraction += days / new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  }
  return Math.round(amountCents * fraction);
}

function currentPeriodTarget(monthlyAmountCents: number) {
  return cy
    .task("dbQuery", "select to_char(\"start\", 'YYYY-MM-DD') as s, to_char(\"end\", 'YYYY-MM-DD') as e from pay_periods where \"start\" <= current_date and \"end\" >= current_date")
    .then((rows) => {
      const { s, e } = (rows as { s: string; e: string }[])[0];
      return monthlyShareCents(monthlyAmountCents, s, e);
    });
}

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
      expect(Number((rows as Array<{ budgeted_amount_cents: string; n: string }>)[0].budgeted_amount_cents)).to.equal(300000);
    });
    currentPeriodTarget(300000).then((targetCents) => {
      cy.contains("tr", "Alimentación").within(() => {
        cy.contains("$3,600.00").should("be.visible");
        cy.contains(formatCents(targetCents)).should("be.visible");
        cy.contains(`${Math.round((360000 / targetCents) * 100)}%`).should("be.visible");
      });
    });
  });

  it("Transporte aparece bajo presupuesto", () => {
    currentPeriodTarget(200000).then((targetCents) => {
      cy.contains("tr", "Transporte").within(() => {
        cy.contains("$800.00").should("be.visible");
        cy.contains(formatCents(targetCents)).should("be.visible");
        cy.contains(`${Math.round((80000 / targetCents) * 100)}%`).should("be.visible");
      });
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
    cy.get('[role="dialog"]').contains("button", "Guardar").click();

    currentPeriodTarget(50000).then((manualShareCents) => {
      cy.contains("tr", "Ocio").within(() => {
        cy.contains(formatCents(manualShareCents + NETFLIX_RECURRING_CENTS)).should("be.visible");
      });
    });
    cy.task("dbQuery", "select budgeted_amount_cents from budget_category_settings where category_id = 5").then((rows) => {
      expect(Number((rows as Array<{ budgeted_amount_cents: string; n: string }>)[0].budgeted_amount_cents)).to.equal(50000);
    });
  });

  it("editar presupuesto existente actualiza el monto en base", () => {
    cy.contains("tr", "Transporte").within(() => {
      cy.get('[aria-label="Editar presupuesto de Transporte"]').click();
    });
    cy.get('input[name="amount"]').clear().type("250");
    cy.get('[role="dialog"]').contains("button", "Guardar").click();
    cy.get('[role="dialog"]').should("not.exist");
    cy.task("dbQuery", "select budgeted_amount_cents from budget_category_settings where category_id = 4").then((rows) => {
      expect(Number((rows as Array<{ budgeted_amount_cents: string; n: string }>)[0].budgeted_amount_cents)).to.equal(25000);
    });
    // restaurar para no afectar otros tests de este spec
    cy.contains("tr", "Transporte").within(() => cy.get('[aria-label="Editar presupuesto de Transporte"]').click());
    cy.get('input[name="amount"]').clear().type("2000");
    cy.get('[role="dialog"]').contains("button", "Guardar").click();
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("el botón de cerrar (X) del modal de presupuesto cierra sin guardar cambios", () => {
    cy.contains("tr", "Alimentación").within(() => {
      cy.get('[aria-label="Editar presupuesto de Alimentación"]').click();
    });
    cy.get('input[name="amount"]').clear().type("999999");
    cy.get('[data-slot="modal-close-trigger"]').click();
    cy.contains("Presupuesto — Alimentación").should("not.exist");
    cy.task("dbQuery", "select budgeted_amount_cents from budget_category_settings where category_id = 3").then((rows) => {
      expect(Number((rows as Array<{ budgeted_amount_cents: string; n: string }>)[0].budgeted_amount_cents)).to.equal(300000);
    });
  });

  it("quitar presupuesto elimina la fila de budget_category_settings", () => {
    cy.contains("tr", "Ocio").within(() => {
      cy.get('[aria-label="Quitar presupuesto de Ocio"]').click();
    });
    cy.contains("¿Quitar el presupuesto").should("be.visible");
    cy.contains("button", "Sí, quitar").click();
    cy.get('[role="dialog"]').should("not.exist");
    cy.task("dbQuery", "select count(*) as n from budget_category_settings where category_id = 5").then((rows) => {
      expect((rows as Array<{ budgeted_amount_cents: string; n: string }>)[0].n).to.equal("0");
    });
    cy.contains("tr", "Ocio").within(() => {
      cy.contains(formatCents(NETFLIX_RECURRING_CENTS)).should("be.visible");
    });
  });

  it("el botón cancelar de confirmar-eliminar cierra sin borrar", () => {
    cy.task("dbQuery", "select count(*) as n from budget_category_settings where category_id = 3").then((before) => {
      cy.contains("tr", "Alimentación").within(() => {
        cy.get('[aria-label="Quitar presupuesto de Alimentación"]').click();
      });
      cy.get('[data-slot="modal-close-trigger"]').click();
      cy.task("dbQuery", "select count(*) as n from budget_category_settings where category_id = 3").then((after) => {
        expect((after as Array<{ budgeted_amount_cents: string; n: string }>)[0].n).to.equal((before as Array<{ budgeted_amount_cents: string; n: string }>)[0].n);
      });
    });
  });
});
