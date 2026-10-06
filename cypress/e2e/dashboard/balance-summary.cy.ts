import { dbQuery, loginAsE2EUser } from "./_helpers";

describe("BalanceSummaryRow", () => {
  beforeEach(() => {
    loginAsE2EUser();
    cy.visit("/");
  });

  it("muestra los 3 bloques: Saldo total, Deuda total, Ahorros", () => {
    cy.contains("Saldo total").should("be.visible");
    cy.contains("Deuda total").should("be.visible");
    cy.contains("Ahorros").should("be.visible");
  });

  it("la deuda total coincide con la suma de los balances negativos de las cuentas de pasivo (tarjeta + préstamo)", () => {
    dbQuery<{ debt: string }>(
      `select abs(sum(t.amount_cents)) as debt
       from transactions t
       join accounts a on a.id = t.account_id
       where a.family_id = 1 and a.classification = 'liability'`,
    ).then(([row]) => {
      const expectedDebtCents = Number(row.debt);
      expect(expectedDebtCents).to.be.greaterThan(0);
      const expectedFormatted = (expectedDebtCents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
      cy.contains("Deuda total").parent().parent().contains(expectedFormatted).should("be.visible");
    });
  });

  it("el detalle de deuda muestra las cuentas de pasivo (Nu TDC, Préstamo Auto) y el pago del periodo", () => {
    cy.contains("Deuda total").parent().parent().contains(/Ver detalle/).click();
    cy.contains("Nu TDC").should("be.visible");
    cy.contains("Préstamo Auto").should("be.visible");
    cy.contains(/Has pagado .* este periodo/).should("be.visible");
    cy.get('[data-slot="modal-close-trigger"]').first().click();
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("los ahorros totales coinciden con el balance real de la cuenta Nu Ahorro", () => {
    dbQuery<{ balance: string }>(
      `select sum(t.amount_cents) as balance
       from transactions t
       join accounts a on a.id = t.account_id
       where a.family_id = 1 and a.name = 'Nu Ahorro'`,
    ).then(([row]) => {
      const expectedCents = Number(row.balance);
      const expectedFormatted = (expectedCents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
      cy.contains("Ahorros").parent().parent().contains(expectedFormatted).should("be.visible");
    });
  });

  it("el detalle de ahorro/metas muestra la meta 'Vacaciones' con su progreso", () => {
    cy.contains("Ahorros").parent().parent().contains(/Ver detalle/).click();
    cy.contains("Vacaciones").should("be.visible");
    cy.contains("Ahorro y metas").should("be.visible");
  });
});
