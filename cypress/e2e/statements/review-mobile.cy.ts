export {};

const PDF = "%PDF-1.4\n% revisión móvil\n";

const row = (index: number, overrides: Record<string, unknown>) => ({
  index,
  hash: `h${index}`,
  status: "new",
  match: null,
  selected: true,
  defaultAction: "import",
  locked: false,
  sameAmountElsewhere: [],
  pairSuggestion: null,
  ...overrides,
});

const preview = {
  bank: "bbva_debito",
  accountLast4: "1032",
  periodStart: "2026-09-05",
  periodEnd: "2026-10-04",
  openingBalanceCents: 100_000,
  closingBalanceCents: 95_000,
  validation: { matches: true, checks: [{ label: "Saldo final", expected: 95_000, actual: 95_000, isMoney: true }] },
  metadata: {},
  warnings: [],
  rows: [
    row(0, { transaction: { date: "2026-09-06", description: "OXXO MONARCA MID", amountCents: -6_700, type: "expense" } }),
    row(1, { transaction: { date: "2026-09-10", description: "PAGO DE NOMINA", amountCents: 2_000_000, type: "income" } }),
    row(2, {
      status: "probable_match",
      defaultAction: "skip",
      selected: false,
      transaction: { date: "2026-09-12", description: "SPEI ENVIADO NU", amountCents: -20_000, type: "internal_transfer" },
      match: { transactionId: 9, name: "Transferencia enviada", date: "2026-09-12", amountCents: -20_000, categoryId: null, source: "api", confidence: "high", dateDistance: 0, similarity: 0.9 },
    }),
    row(3, { status: "already_imported", locked: true, defaultAction: "skip", selected: false, transaction: { date: "2026-08-30", description: "SUPER LA PLAZA", amountCents: -45_000, type: "expense" } }),
  ],
  unmatchedExisting: [{ id: 5, date: "2026-09-20", name: "Café", amountCents: -5_000, source: "manual" }],
  counts: { new: 2, probableMatch: 1, alreadyImported: 1 },
};

describe("Revisión de un estado en móvil", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.intercept("POST", "/api/statements/parse", { statusCode: 200, body: { ok: true, preview } });
    cy.viewport(390, 844);
  });

  function openReview() {
    cy.visit("/import");
    cy.get("[data-testid=statement-file-input]").selectFile({ contents: Cypress.Buffer.from(PDF), fileName: "1568871032_202610.pdf", mimeType: "application/pdf" }, { force: true });
    cy.get("select[aria-label^='Banco de']").select("bbva_debito");
    cy.get("select[aria-label^='Cuenta de']").find("option").eq(1).then((option) => cy.get("select[aria-label^='Cuenta de']").select(option.val() as string));
    cy.contains("button", "Confirmar").click();
    cy.get("[aria-label^='Revisión de']").should("be.visible");
  }

  it("muestra chips cortos, ayuda en un modal, edición por fila oculta y el resumen de importación al final", () => {
    openReview();
    cy.get("[aria-label^='Revisión de']").within(() => {
      cy.get("[role=group][aria-label='Qué revisar']").within(() => {
        ["Nuevos 2", "Ya los tengo 1", "Importados 1", "Solo en mi app 1"].forEach((label) => cy.contains("button", label).should("be.visible"));
      });
      cy.contains("Movimientos del PDF que todavía no tienes").should("not.be.visible");
      cy.get("button[aria-label='¿Qué significa esta pestaña?']").click();
    });
    cy.get("[role=dialog]").within(() => {
      ["Nuevos", "Ya los tengo", "Importados", "Solo en mi app"].forEach((title) => cy.contains("p", title).should("be.visible"));
      cy.contains("Movimientos del PDF que todavía no tienes").should("be.visible");
    });
    cy.get("body").type("{esc}");
    cy.get("[role=dialog]").should("not.exist");

    cy.get("[aria-label^='Revisión de']").within(() => {
      cy.contains("li", "OXXO MONARCA MID").within(() => {
        cy.get("select[aria-label='Tipo']").should("not.be.visible");
        cy.contains("button", "Cambiar tipo o categoría").click();
        cy.get("select[aria-label='Tipo']").should("be.visible");
      });
      cy.contains("2 movimientos").scrollIntoView().should("be.visible");
      cy.contains("2 por crear").should("be.visible");
      cy.contains("button", "Importar").should("be.visible").then(($button) => {
        expect($button[0].getBoundingClientRect().width).to.be.lessThan(160);
      });
    });
  });

  it("en la pestaña de coincidencias la decisión ocupa todo el ancho y se puede cambiar", () => {
    openReview();
    cy.get("[role=group][aria-label='Qué revisar']").contains("button", "Ya los tengo 1").click();
    cy.contains("li", "SPEI ENVIADO NU").within(() => {
      cy.contains("Muy probable").should("be.visible");
      cy.contains("button", "Es el mío: vincular").then(($button) => $button[0].scrollIntoView({ block: "center" }));
      cy.contains("button", "Es el mío: vincular").click();
    });
    cy.contains("3 movimientos").scrollIntoView().should("be.visible");
    cy.contains("1 por vincular").should("be.visible");
  });
});
