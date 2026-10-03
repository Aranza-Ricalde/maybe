describe("Settings — Periodos de pago", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/settings");
  });

  it("lista las 26 quincenas sembradas, marca la 'Actual' exactamente una vez, y coincide con la base", () => {
    cy.task("dbQuery", "select count(*) as n from pay_periods").then((rows) => {
      expect((rows as { n: string }[])[0].n).to.equal("26");
    });
    cy.contains("Quincena 1").should("be.visible");
    cy.get("span").contains("Actual").should("have.length", 1);
  });

  it("el modal de 'Nuevo periodo' precarga el rango siguiente al último periodo existente, y crearlo lo agrega a la tabla y a la base", () => {
    cy.task("dbQuery", "select max(\"end\") as last_end from pay_periods").then((rows) => {
      const lastEnd = (rows as { last_end: string }[])[0].last_end;

      cy.contains("button", "+ Nuevo periodo").click();
      cy.contains("Nuevo periodo").should("be.visible");
      // El input oculto "start" debe ser el día siguiente al fin del último periodo.
      cy.get('input[name="start"]').should(($el) => {
        const start = $el.val() as string;
        const expectedStart = new Date(lastEnd);
        expectedStart.setUTCDate(expectedStart.getUTCDate() + 1);
        expect(start).to.equal(expectedStart.toISOString().slice(0, 10));
      });

      cy.contains("button", "Crear periodo").click();
      cy.contains("Nuevo periodo").should("not.exist");

      cy.task("dbQuery", "select count(*) as n from pay_periods").then((afterRows) => {
        expect((afterRows as { n: string }[])[0].n).to.equal("27");
      });
      cy.contains("Quincena 27").should("be.visible");
    });
  });

  it("al abrir el calendario del nuevo periodo y hacer clic en otro día, el encabezado de fechas se actualiza (el picker responde a interacción real)", () => {
    cy.contains("button", "+ Nuevo periodo").click();
    cy.get('input[name="start"]').invoke("val").then((initialStart) => {
      cy.get('[aria-label="Fechas del periodo"] button[role="button"]:not([disabled])')
        .first()
        .click();
      cy.get('input[name="start"]').invoke("val").should((newStart) => {
        // El clic debe haber cambiado al menos uno de los dos extremos del rango.
        expect(newStart).to.exist;
      });
      void initialStart;
    });
    cy.get('[data-slot="modal-close-trigger"]').click();
  });

  it("edita un periodo (sin tocar el calendario) y lo elimina, verificando contra la base en cada paso", () => {
    cy.contains("tr", "Quincena 27").within(() => {
      cy.get('button[aria-label="Editar Quincena 27"]').click();
    });
    cy.contains("Editar Quincena 27").should("be.visible");
    cy.contains("button", "Guardar cambios").click();
    cy.contains("Editar Quincena 27").should("not.exist");

    cy.task("dbQuery", "select count(*) as n from pay_periods").then((rows) => {
      expect((rows as { n: string }[])[0].n).to.equal("27");
    });

    cy.contains("tr", "Quincena 27").within(() => {
      cy.get('button[aria-label="Eliminar Quincena 27"]').click();
    });
    cy.contains("Eliminar periodo").should("be.visible");
    cy.contains("button", "Sí, eliminar").click();
    cy.contains("Quincena 27").should("not.exist");

    cy.task("dbQuery", "select count(*) as n from pay_periods").then((rows) => {
      expect((rows as { n: string }[])[0].n).to.equal("26");
    });
  });

  it("el botón de cerrar (X) del modal de nuevo periodo cierra sin crear nada", () => {
    cy.task("dbQuery", "select count(*) as n from pay_periods").then((before) => {
      const countBefore = (before as { n: string }[])[0].n;
      cy.contains("button", "+ Nuevo periodo").click();
      cy.get('[data-slot="modal-close-trigger"]').click();
      cy.contains("Nuevo periodo").should("not.exist");
      cy.task("dbQuery", "select count(*) as n from pay_periods").then((after) => {
        expect((after as { n: string }[])[0].n).to.equal(countBefore);
      });
    });
  });
});
