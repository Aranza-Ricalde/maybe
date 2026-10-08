describe("Recurrentes: columna Suma al presupuesto", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/recurring");
  });

  it("explica la columna en un tooltip y nombra cada estado sin ambigüedad", () => {
    cy.contains("th", "Suma al presupuesto").should("be.visible");
    cy.get('[aria-label="¿Qué significa Suma al presupuesto?"]').focus();
    cy.contains("Suma este pago al presupuesto de su categoría").should("be.visible");
    cy.contains("tr", "Netflix").contains(/Por confirmar|Suma|No suma/).should("be.visible");
  });
});
