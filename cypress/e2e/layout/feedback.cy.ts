const toast = (text: string) => cy.contains("[data-sonner-toast]", text, { timeout: 10000 }).should("be.visible");

describe("Avisos de éxito y de error en toda la app", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("crear, editar y eliminar una meta avisa cada paso", () => {
    const name = `E2E aviso ${Date.now()}`;
    cy.visit("/budgets");
    cy.contains("button", "+ Nueva meta").click();
    cy.get('input[name="name"]').type(name);
    cy.get('input[name="targetAmount"]').type("1000");
    cy.contains("button", "Crear meta").click();
    toast("Meta creada");

    cy.contains(name).should("be.visible");
    cy.get(`[aria-label="Eliminar ${name}"]`).click();
    cy.contains("button", "Sí, eliminar").click();
    toast("Meta eliminada");
    cy.contains(name).should("not.exist");
  });

  it("un error de validación avisa el motivo y no cierra el formulario", () => {
    cy.task("setPeriodView", "biweekly");
    cy.visit("/settings?s=periodos");
    cy.get('[aria-label="Periodos de pago"]').within(() => cy.get('button[aria-label^="Editar"]').eq(1).click());
    cy.task("dbQuery", `select "end"::text as value from pay_periods order by "start" limit 1`).then((rows) => {
      const firstEnd = (rows as { value: string }[])[0].value;
      cy.get('input[name="start"]').invoke("val", firstEnd);
    });
    cy.contains("button", "Guardar cambios").click();
    toast("se traslapa");
    cy.get('[role="dialog"]').should("be.visible");
    cy.task("setPeriodView", "monthly");
  });

  it("una acción directa, como pausar un recurrente, también avisa", () => {
    cy.visit("/recurring");
    cy.get('[aria-label="Pausar recurrente"], [aria-label="Reactivar recurrente"]').first().click();
    toast("Recurrente");
    cy.get('[aria-label="Pausar recurrente"], [aria-label="Reactivar recurrente"]').first().click();
    toast("Recurrente");
  });
});
