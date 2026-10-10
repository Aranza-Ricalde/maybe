export {};

const UPDATE_ID = 910_000_001;

describe("Webhook de Telegram: un update repetido se procesa una sola vez", () => {
  it("guarda el update_id y rechaza silenciosamente el reintento", () => {
    cy.task("telegramWebhookSecret").then((secret) => {
      const send = () =>
        cy.request({
          method: "POST",
          url: "/api/telegram/webhook",
          headers: { "x-telegram-bot-api-secret-token": secret as string },
          body: { update_id: UPDATE_ID, message: { chat: { id: 555000111 }, text: "hola" } },
        });
      send().its("status").should("eq", 200);
      send().its("status").should("eq", 200);
      cy.task("dbQuery", `select count(*)::int as n from telegram_processed_updates where update_id = ${UPDATE_ID}`).then((rows) => {
        expect((rows as { n: number }[])[0].n).to.equal(1);
      });
    });
  });

  it("sin el secreto del webhook responde 401 y no guarda nada", () => {
    cy.request({ method: "POST", url: "/api/telegram/webhook", failOnStatusCode: false, body: { update_id: 910_000_002, message: { chat: { id: 1 }, text: "x" } } }).its("status").should("eq", 401);
    cy.task("dbQuery", "select count(*)::int as n from telegram_processed_updates where update_id = 910000002").then((rows) => {
      expect((rows as { n: number }[])[0].n).to.equal(0);
    });
  });
});
