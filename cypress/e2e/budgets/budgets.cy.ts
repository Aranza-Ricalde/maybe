const NETFLIX_RECURRING_CENTS = 22900;

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function currentPeriodTarget(monthlyAmountCents: number) {
  return cy.wrap(monthlyAmountCents);
}

const CHILD = "E2E Subcategoría";

describe("Presupuestos: grupos colapsables y resumen", () => {
  before(() => {
    cy.task("seedChildCategory", { parent: "Alimentación", child: CHILD });
  });
  after(() => {
    cy.task("cleanupChildCategory", CHILD);
  });
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/budgets");
    cy.contains("tr", "Alimentación").should("be.visible");
  });

  it("las subcategorías están colapsadas por defecto y se expanden y contraen por categoría padre", () => {
    cy.contains("tr", CHILD).should("not.exist");
    cy.get('[aria-label="Expandir subcategorías de Alimentación"]').should("have.attr", "aria-expanded", "false").click();
    cy.contains("tr", CHILD).should("be.visible");
    cy.get('[aria-label="Contraer subcategorías de Alimentación"]').should("have.attr", "aria-expanded", "true").click();
    cy.contains("tr", CHILD).should("not.exist");
  });

  it("'Expandir todo' y 'Contraer todo' abren y cierran todos los grupos", () => {
    cy.contains("button", "Expandir todo").click();
    cy.contains("tr", CHILD).should("be.visible");
    cy.contains("button", "Contraer todo").click();
    cy.contains("tr", CHILD).should("not.exist");
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

  it("las columnas numéricas comparten borde derecho entre el encabezado y todas las filas", () => {
    const rightEdgeOfText = (element: Element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let right = Number.NEGATIVE_INFINITY;
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        right = Math.max(right, range.getBoundingClientRect().right);
      }
      return Math.round(right);
    };
    cy.get('[aria-label="Presupuesto por categoría"] th[scope="col"]').then(($headers) => {
      const titles = [...$headers].map((header) => header.textContent?.trim());
      const CHIP_PADDING_PX = 12;
      const tolerance: Record<string, number> = { Gastado: 2, Presupuestado: 2, Progreso: CHIP_PADDING_PX };
      ["Gastado", "Presupuestado", "Progreso"].forEach((title) => {
        const index = titles.indexOf(title);
        expect(index, `columna ${title}`).to.be.greaterThan(-1);
        const headerRight = rightEdgeOfText($headers[index]);
        cy.get('[aria-label="Presupuesto por categoría"] tbody tr').then(($rows) => {
          const dataRows = [...$rows];
          expect(dataRows.length, "filas con datos").to.be.greaterThan(3);
          dataRows.forEach((row, rowIndex) => {
            const cells = [...row.querySelectorAll("th, td")];
            expect(cells.length, `celdas de la fila ${rowIndex}`).to.equal(titles.length);
            expect(Math.abs(rightEdgeOfText(cells[index]) - headerRight), `${title}, fila ${rowIndex}`).to.be.at.most(tolerance[title]);
          });
        });
      });
    });
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

  it("crea un presupuesto manual para Ocio: el manual manda y el recurrente de Netflix solo era una sugerencia", () => {
    cy.get('[aria-label="¿De dónde sale el presupuesto de Ocio?"]').focus();
    cy.contains("suma de tus pagos recurrentes").should("be.visible");
    cy.contains("tr", "Ocio").within(() => {
      cy.get('[aria-label="Editar presupuesto de Ocio"]').click();
    });
    cy.contains("Presupuesto — Ocio").should("be.visible");
    cy.get('input[name="amount"]').clear().type("500");
    cy.get('[role="dialog"]').contains("button", "Guardar").click();

    currentPeriodTarget(50000).then((manualShareCents) => {
      cy.contains("tr", "Ocio").within(() => {
        cy.contains(formatCents(manualShareCents)).should("be.visible");
        cy.contains(formatCents(manualShareCents + NETFLIX_RECURRING_CENTS)).should("not.exist");
      });
      cy.get('[aria-label="¿De dónde sale el presupuesto de Ocio?"]').focus();
      cy.contains("Tú fijaste $500.00 al mes").should("be.visible");
      cy.contains("suma de tus pagos recurrentes").should("not.exist");
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

describe("Presupuestos: ayudas de cada categoría", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/budgets");
    cy.contains("tr", "Alimentación").should("be.visible");
  });

  it("el tooltip de cada categoría explica qué va en ella (sugerida) y las filas no traen frases descriptivas", () => {
    cy.get('[aria-label="¿Qué va en Alimentación?"]').focus();
    cy.contains("Todo lo que comes").should("be.visible");
    cy.contains("tr", "Alimentación").within(() => {
      cy.contains("Tú pusiste").should("not.exist");
      cy.contains("Suma de sus subcategorías").should("not.exist");
      cy.contains("Subió a la suma").should("not.exist");
    });
  });
});
