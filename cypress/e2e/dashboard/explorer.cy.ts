import { dbQuery, loginAsE2EUser } from "./_helpers";

const peso = (cents: number) => `$${Math.round(cents / 100).toLocaleString("es-MX")}`;

function currentPeriod() {
  return dbQuery<{ s: string; e: string }>(`select to_char("start", 'YYYY-MM-DD') as s, to_char("end", 'YYYY-MM-DD') as e from pay_periods where "start" <= current_date and "end" >= current_date`).then(([row]) => row);
}

function expenseCents(from: string, to: string, categoryId?: number) {
  const category = categoryId ? `and t.category_id = ${categoryId}` : "";
  return dbQuery<{ total: string | null }>(
    `select coalesce(sum(-t.amount_cents), 0) as total from transactions t join accounts a on a.id = t.account_id where a.family_id = 1 and t.kind = 'standard' and t.amount_cents < 0 and t.date between '${from}' and '${to}' ${category}`,
  ).then(([row]) => Number(row.total));
}

describe("Dashboard: explorador interactivo", () => {
  beforeEach(() => {
    loginAsE2EUser();
    cy.visit("/");
    cy.contains("Explora tu dinero").should("be.visible");
  });

  it("empieza en el periodo actual y su total de gastos coincide con la base", () => {
    currentPeriod().then(({ s, e }) => {
      expenseCents(s, e).then((expected) => {
        cy.get('[data-testid="explorer-summary"]').should("contain", peso(expected));
      });
    });
    cy.contains("contra el periodo anterior").should("exist");
  });

  it("cambiar el rango a 3 meses recalcula contra la base sin recargar la página", () => {
    cy.choosePeriod("3 meses");
    cy.task("dbQuery", `select to_char(date_trunc('month', current_date) - interval '2 months', 'YYYY-MM-DD') as f, to_char(current_date, 'YYYY-MM-DD') as t`).then((rows) => {
      const { f, t } = (rows as { f: string; t: string }[])[0];
      expenseCents(f, t).then((expected) => {
        cy.get('[data-testid="explorer-summary"]').should("contain", peso(expected));
      });
    });
  });

  it("filtrar por categoría deja solo el gasto de esa categoría, y se puede quitar con 'Limpiar filtros'", () => {
    cy.choosePeriod("3 meses");
    cy.task("dbQuery", `select to_char(date_trunc('month', current_date) - interval '2 months', 'YYYY-MM-DD') as f, to_char(current_date, 'YYYY-MM-DD') as t`).then((rows) => {
      const { f, t } = (rows as { f: string; t: string }[])[0];
      expenseCents(f, t, 3).then((categoryTotal) => {
        expenseCents(f, t).then((allTotal) => {
          expect(categoryTotal).to.be.greaterThan(0);
          expect(categoryTotal).to.be.lessThan(allTotal);
          cy.contains("button", "Filtros").click();
          cy.chooseOption("Categoría", "Alimentación");
          cy.get("body").type("{esc}");
          cy.get('[data-testid="explorer-summary"]').should("contain", peso(categoryTotal));
          cy.get('[aria-label="Limpiar filtros"]').click();
          cy.get('[data-testid="explorer-summary"]').should("contain", peso(allTotal));
        });
      });
    });
  });

  it("en la vista 'Por categoría' un clic en una categoría aplica el filtro y las demás vistas lo respetan", () => {
    cy.choosePeriod("3 meses");
    cy.contains("button", "Por categoría").click();
    cy.get('[aria-label="Filtrar por Alimentación"]').click();
    cy.contains('[data-slot="badge"]', "Categoría:").should("contain", "Alimentación");
    cy.contains("button", "Ingresos y gastos").click();
    cy.get('[aria-label="Gastos e ingresos por periodo"]').should("exist");
    cy.contains("button", "Por comercio").click();
    cy.contains("Sin comercio identificado").should("exist");
  });

  it("la vista de saldo muestra la gráfica y avisa que solo usa el filtro de cuenta", () => {
    cy.contains("button", "Saldo").click();
    cy.contains("El saldo solo usa el filtro de cuenta").should("be.visible");
  });
});
