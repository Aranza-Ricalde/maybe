describe("Settings — Tu cuenta y Telegram", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/settings");
  });

  it("muestra el nombre y email reales del usuario sembrado", () => {
    cy.task("dbQuery", "select name, email from users where id = 1").then((rows) => {
      const user = (rows as { name: string; email: string }[])[0];
      cy.contains("Tu cuenta").should("be.visible");
      cy.contains(user.name).should("be.visible");
      cy.contains(user.email).should("be.visible");
    });
  });

  it("muestra 'Sin vincular' para Telegram (el seed no vincula telegramChatId) y el modal de instrucciones abre y cierra", () => {
    cy.task("dbQuery", "select telegram_chat_id from users where id = 1").then((rows) => {
      expect((rows as { telegram_chat_id: string | null }[])[0].telegram_chat_id).to.be.null;
    });
    cy.contains("Sin vincular").should("be.visible");
    cy.contains("Vinculado").should("not.exist");

    cy.contains("¿Cómo vincular?").click();
    cy.contains("Vincular Telegram").should("be.visible");
    cy.contains("@V2_MaybeBot").should("be.visible");
    cy.contains(/\/link [A-F0-9]{10}/).should("be.visible");
    cy.contains("/link").should("be.visible");

    cy.get('[data-slot="modal-close-trigger"], [data-slot="close-button"]').first().click();
    cy.contains("Vincular Telegram").should("not.exist");
  });

  it("muestra los encabezados de las secciones de administración", () => {
    cy.contains("h2, h3, [data-slot='card-title']", "Categorías").should("be.visible");
    cy.contains("h2, h3, [data-slot='card-title']", "Cómo ver tus periodos").should("be.visible");
  });
});
