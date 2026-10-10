const NETFLIX_RECURRING_CENTS = 22900;

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const CHILD = "E2E Subcategoría";

const RINGS = '[aria-label="Presupuesto por categoría"]';
const UNBUDGETED = '[aria-label="Categorías sin presupuesto"]';
const DIALOG = '[role="dialog"]';

function openCategory(name: string) {
  cy.get(`[aria-label="Editar presupuesto de ${name}"]`).first().click();
  cy.contains(DIALOG, `Presupuesto — ${name}`).should("be.visible");
}

function closeDialog() {
  cy.get('[data-slot="dialog-close"]').click();
  cy.get(DIALOG).should("not.exist");
}

function budgetCents(categoryId: number) {
  return cy.task("dbQuery", `select budgeted_amount_cents from budget_category_settings where category_id = ${categoryId}`).then((rows) => Number((rows as Array<{ budgeted_amount_cents: string }>)[0]?.budgeted_amount_cents));
}

describe("Presupuestos: subcategorías y resumen", () => {
  before(() => {
    cy.task("seedChildCategory", { parent: "Alimentación", child: CHILD });
  });
  after(() => {
    cy.task("cleanupChildCategory", CHILD);
  });
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/budgets");
    cy.get(RINGS).contains("Alimentación").should("be.visible");
  });

  it("las subcategorías no son anillos y aparecen dentro del modal de su categoría padre", () => {
    cy.get(RINGS).contains(CHILD).should("not.exist");
    openCategory("Alimentación");
    cy.get(DIALOG).find('[aria-label="Subcategorías"]').contains(CHILD).should("be.visible");
    closeDialog();
  });

  it("el resumen suma lo presupuestado y lo gastado de las categorías principales y avisa cuáles se pasaron", () => {
    cy.contains("Presupuestado").should("be.visible");
    cy.contains(/categor(í|i)as? se pas(ó|o|aron)/).should("be.visible");
  });
});

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
    budgetCents(3).should("equal", 300000);
    cy.get(RINGS).contains("button", "Alimentación").within(() => {
      cy.contains("$3,600.00").should("be.visible");
      cy.contains(formatCents(300000)).should("be.visible");
      cy.contains(`${Math.round((360000 / 300000) * 100)}%`).should("be.visible");
    });
  });

  it("Transporte aparece bajo presupuesto", () => {
    cy.get(RINGS).contains("button", "Transporte").within(() => {
      cy.contains("$800.00").should("be.visible");
      cy.contains(formatCents(200000)).should("be.visible");
      cy.contains("40%").should("be.visible");
    });
  });

  it("las categorías sin presupuesto empiezan ocultas y se muestran con un botón", () => {
    cy.get(UNBUDGETED).should("not.exist");
    cy.contains("button", /Sin presupuesto \(\d+\)/).click();
    cy.get(UNBUDGETED).contains("li", "Nómina").within(() => {
      cy.contains("button", "Definir presupuesto").should("be.visible");
    });
    cy.contains("button", /Sin presupuesto \(\d+\)/).click();
    cy.get(UNBUDGETED).should("not.exist");
  });

  it("crea un presupuesto manual para Ocio: el manual manda y el recurrente de Netflix solo era una sugerencia", () => {
    openCategory("Ocio");
    cy.get(DIALOG).contains("suma de tus pagos recurrentes").should("be.visible");
    cy.get(DIALOG).find('input[name="amount"]').first().clear().type("500");
    cy.get(DIALOG).contains("button", "Guardar").click();
    cy.get(DIALOG).contains("Tú fijaste $500.00 al mes").should("be.visible");
    cy.get(DIALOG).contains("suma de tus pagos recurrentes").should("not.exist");
    budgetCents(5).should("equal", 50000);
    closeDialog();
    cy.get(RINGS).contains("button", "Ocio").within(() => {
      cy.contains(formatCents(50000)).should("be.visible");
      cy.contains(formatCents(50000 + NETFLIX_RECURRING_CENTS)).should("not.exist");
    });
  });

  it("editar presupuesto existente actualiza el monto en base", () => {
    openCategory("Transporte");
    cy.get(DIALOG).find('input[name="amount"]').first().clear().type("250");
    cy.get(DIALOG).contains("button", "Guardar").click();
    cy.contains("Presupuesto guardado").should("be.visible");
    budgetCents(4).should("equal", 25000);
    closeDialog();
    cy.get(RINGS).contains("button", "Transporte").should("contain", "$250.00");
    openCategory("Transporte");
    cy.get(DIALOG).find('input[name="amount"]').first().clear().type("2000");
    cy.get(DIALOG).contains("button", "Guardar").click();
    cy.get(DIALOG).contains("de $2,000.00").should("be.visible");
    budgetCents(4).should("equal", 200000);
    closeDialog();
  });

  it("el botón de cerrar (X) del modal de presupuesto cierra sin guardar cambios", () => {
    openCategory("Alimentación");
    cy.get(DIALOG).find('input[name="amount"]').first().clear().type("999999");
    closeDialog();
    budgetCents(3).should("equal", 300000);
  });

  it("quitar presupuesto elimina la fila de budget_category_settings", () => {
    openCategory("Ocio");
    cy.get('[aria-label="Quitar presupuesto de Ocio"]').click();
    cy.contains("Presupuesto quitado").should("be.visible");
    cy.task("dbQuery", "select count(*) as n from budget_category_settings where category_id = 5").then((rows) => {
      expect((rows as Array<{ n: string }>)[0].n).to.equal("0");
    });
    closeDialog();
    cy.get(RINGS).contains("button", "Ocio").should("contain", formatCents(NETFLIX_RECURRING_CENTS));
  });
});

describe("Presupuestos: ayudas de cada categoría", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/budgets");
    cy.get(RINGS).contains("Alimentación").should("be.visible");
  });

  it("el modal explica qué va en la categoría (sugerida) y el tooltip de la tarjeta de anillos no trae frases sueltas", () => {
    openCategory("Alimentación");
    cy.get(DIALOG).contains("Todo lo que comes").should("be.visible");
    closeDialog();
    cy.get(RINGS).within(() => {
      cy.contains("Tú pusiste").should("not.exist");
      cy.contains("Suma de sus subcategorías").should("not.exist");
      cy.contains("Subió a la suma").should("not.exist");
    });
  });
});
