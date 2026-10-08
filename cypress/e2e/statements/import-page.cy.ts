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
      cy.get("select[aria-label^='Cuenta de']").find("option").eq(1).then((option) => cy.get("select[aria-label^='Cuenta de']").select(option.val() as string));
      cy.contains("No se reconoce el formato", { timeout: 15000 });
      cy.contains("[data-sonner-toast]", "No se pudo leer el estado").should("be.visible");
      cy.get("[data-sonner-toast]", { timeout: 12000 }).should("not.exist");
      cy.get("aside[aria-label='Progreso de importación']").should("not.exist");
      cy.contains("nav a", "Resumen").click();
      cy.get("aside[aria-label='Progreso de importación']").should("be.visible");
      cy.get("aside [role=progressbar]").should("have.length.at.least", 2);
      cy.task("dbQuery", "select count(*)::int as n from transactions").should("deep.equal", before);
    });
  });
});
