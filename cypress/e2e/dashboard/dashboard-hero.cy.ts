import { dbQuery, loginAsE2EUser } from "./_helpers";

describe("Resumen: cifra protagonista, ritmo de gasto y pendientes", () => {
  beforeEach(() => {
    loginAsE2EUser();
    cy.visit("/");
  });

  it("muestra la cifra protagonista y el aviso del ritmo contra el presupuesto", () => {
    cy.contains("Disponible para gastar").should("be.visible");
    cy.contains("Disponible para gastar").parent().parent().find("p.tabular-nums").invoke("text").should("match", /\$[\d,]+\.\d{2}/);
    cy.get('[aria-label="Gasto del periodo contra tu presupuesto"]').within(() => {
      cy.get('[role="img"]').should("be.visible");
      cy.get('[role="alert"]').should("be.visible");
    });
  });

  it("la franja de métricas separa Gastado, Ingresos, lo que aportaste a ahorro y los rendimientos", () => {
    ["Gastado", "Ingresos", "Aportaste a ahorro", "Rendimientos"].forEach((label) => cy.contains("dt", label).should("be.visible"));
  });

  it("el gasto del periodo coincide con la base", () => {
    dbQuery<{ total: string }>(
      `select coalesce(sum(-t.amount_cents), 0) as total from transactions t join accounts a on a.id = t.account_id
       join pay_periods p on p."start" <= current_date and p."end" >= current_date
       where a.family_id = 1 and t.kind = 'standard' and t.amount_cents < 0 and t.date between p."start" and p."end" and t.date <= current_date`,
    ).then(([row]) => {
      const expected = `$${Math.round(Number(row.total) / 100).toLocaleString("es-MX")}`;
      cy.contains("dt", "Gastado").parent().should("contain", expected);
    });
  });
});
