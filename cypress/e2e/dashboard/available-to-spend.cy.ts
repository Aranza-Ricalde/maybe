import { dbQuery, loginAsE2EUser } from "./_helpers";

describe("AvailableToSpendCard", () => {
  beforeEach(() => {
    loginAsE2EUser();
    cy.visit("/");
  });

  it("muestra el título, el monto disponible y el detalle", () => {
    cy.contains("Disponible para gastar").should("be.visible");
    // El monto se renderiza con formato de moneda ($X,XXX.XX); solo validamos que exista un número con signo de pesos.
    cy.contains("Disponible para gastar")
      .parent()
      .parent()
      .within(() => {
        cy.contains(/\$[\d,]+\.\d{2}/).should("be.visible");
      });
  });

  it("el botón 'Ver detalle' abre un modal con el saldo líquido por cuenta y compromisos", () => {
    cy.contains(/Ver detalle/).first().click();
    cy.contains("Saldo líquido por cuenta").should("be.visible");
    cy.contains("Compromisos conocidos").should("be.visible");
    cy.get('[data-slot="dialog-close"]').first().click();
    cy.contains("Saldo líquido por cuenta").should("not.exist");
  });

  it("el saldo líquido por cuenta en el detalle coincide con las cuentas líquidas reales (solo checking/cash activas — no savings, no archivadas)", () => {
    dbQuery<{ name: string }>(
      "select a.name from accounts a where a.family_id = 1 and a.is_active = true and a.type in ('checking','cash') order by a.name",
    ).then((rows) => {
      cy.contains(/Ver detalle/).click();
      for (const row of rows) {
        cy.contains("Saldo líquido por cuenta").parent().contains(row.name).should("be.visible");
      }
      // Nu Ahorro (savings) y Efectivo (archivada) NO deben contar como líquidas en esta tarjeta.
      cy.contains("Saldo líquido por cuenta").parent().contains("Nu Ahorro").should("not.exist");
      cy.contains("Saldo líquido por cuenta").parent().contains("Efectivo").should("not.exist");
    });
  });
});
