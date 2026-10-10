const IMPORT_PAGE_PDF = "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";

describe("Importar estados — pantalla", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("aparece en el menú, pide banco y cuenta, y un PDF sin formato muestra un error claro sin guardar nada", () => {
    cy.task("dbQuery", "select count(*)::int as n from transactions").then((before) => {
      cy.visit("/import");
      cy.contains("h1", "Importar estados de cuenta");
      cy.get("nav").contains("Importar estados");
      cy.get("[data-testid=statement-file-input]").selectFile({ contents: Cypress.Buffer.from(IMPORT_PAGE_PDF), fileName: "estado.pdf", mimeType: "application/pdf" }, { force: true });
      cy.contains("Indica banco y cuenta de cada archivo");
      cy.get("select[aria-label^='Banco de']").select("bbva_debito");
      cy.contains("button", "Confirmar").should("not.exist");
      cy.get("select[aria-label^='Cuenta de']").find("option").eq(1).then((option) => cy.get("select[aria-label^='Cuenta de']").select(option.val() as string));
      cy.contains("Confirmar para empezar a leer").should("be.visible");
      cy.contains("No se reconoce el formato").should("not.exist");
      cy.contains("button", "Confirmar").click();
      cy.contains("No se reconoce el formato", { timeout: 15000 });
      cy.contains("[data-sonner-toast]", "No se pudo leer el estado").should("be.visible");
      cy.get("[data-sonner-toast]", { timeout: 12000 }).should("not.exist");
      cy.get("aside[aria-label='Progreso de importación']").should("not.exist");
      cy.contains("nav a", "Resumen").click();
      cy.get("aside[aria-label='Progreso de importación']").should("be.visible");
      cy.get("aside").contains("a", "Revisar estados").should("be.visible");
      cy.get("aside [role=progressbar]").should("not.exist");
      cy.task("dbQuery", "select count(*)::int as n from transactions").should("deep.equal", before);
    });
  });

  it("en móvil, al ocultar el progreso queda una burbuja pequeña que se puede mover y abre el panel al tocarla", () => {
    cy.viewport(390, 844);
    cy.visit("/import");
    cy.get("[data-testid=statement-file-input]").selectFile({ contents: Cypress.Buffer.from(IMPORT_PAGE_PDF), fileName: "estado.pdf", mimeType: "application/pdf" }, { force: true });
    cy.get("select[aria-label^='Banco de']").select("bbva_debito");
    cy.get("select[aria-label^='Cuenta de']").find("option").eq(1).then((option) => cy.get("select[aria-label^='Cuenta de']").select(option.val() as string));
    cy.contains("button", "Confirmar").click();
    cy.contains("No se reconoce el formato", { timeout: 15000 });
    cy.contains("nav a", "Resumen").click();
    cy.get("aside[aria-label='Progreso de importación']").should("be.visible");
    cy.contains("aside button", "Ocultar").click();
    cy.get("aside[aria-label='Progreso de importación']").should("not.be.visible");
    cy.get("button[aria-label^='Importación en curso']").should("be.visible").then(($bubble) => {
      const before = $bubble[0].getBoundingClientRect();
      expect(before.width).to.be.lessThan(60);
      cy.wrap($bubble).trigger("pointerdown", { clientX: before.left + 10, clientY: before.top + 10, pointerId: 1, force: true });
      cy.wrap($bubble).trigger("pointermove", { clientX: before.left - 280, clientY: before.top - 200, pointerId: 1, force: true });
      cy.wrap($bubble).trigger("pointerup", { pointerId: 1, force: true });
      cy.get("button[aria-label^='Importación en curso']").should(($moved) => {
        const after = $moved[0].getBoundingClientRect();
        expect(after.left).to.eq(8);
        expect(after.top).to.be.lessThan(before.top - 100);
      });
    });
    cy.get("button[aria-label^='Importación en curso']").trigger("pointerdown", { pointerId: 2, force: true }).trigger("pointerup", { pointerId: 2, force: true });
    cy.get("aside[aria-label='Progreso de importación']").should("be.visible");
  });
});
