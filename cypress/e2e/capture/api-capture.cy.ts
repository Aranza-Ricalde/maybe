const API = "/api/movements";
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("Registro por API — token, endpoint y confirmación", () => {
  after(() => {
    cy.task("cleanupApiCapture");
  });

  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("genera el token una sola vez, registra por el endpoint y el movimiento pide confirmar categoría en Movimientos", () => {
    cy.visit("/settings");
    cy.contains("button", /Generar/).click();
    cy.contains("Copia tu token ahora").should("be.visible");

    cy.get("[role=status] code")
      .invoke("text")
      .then((token) => {
        expect(token).to.match(/^mv_/);

        cy.request({ method: "POST", url: API, headers: bearer("mv_incorrecto-pero-con-longitud-suficiente"), body: {}, failOnStatusCode: false }).its("status").should("eq", 401);
        cy.request({ method: "POST", url: API, headers: bearer(token), body: { account: "No existe", type: "expense", amount: 10, description: "x" }, failOnStatusCode: false }).its("status").should("eq", 404);
        cy.request({ method: "POST", url: API, headers: bearer(token), body: { account: "Nu Débito", type: "expense", amount: -3, description: "" }, failOnStatusCode: false }).its("status").should("eq", 400);

        cy.request({ method: "POST", url: API, headers: bearer(token), body: { account: "nu debito", type: "expense", amount: "152,50", description: "Zzxq Tienda Rara" } }).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body).to.include({ ok: true, cuenta: "Nu Débito", monto: -152.5, por_confirmar: true });
        });
      });

    cy.visit("/settings");
    cy.contains("Activo · termina en").should("be.visible");
    cy.get("[role=status]").should("not.exist");

    cy.visit("/transactions");
    cy.get('section[aria-label="Movimientos por confirmar"]').within(() => {
      cy.contains("Zzxq Tienda Rara").should("be.visible");
      cy.get('select[aria-label="Categoría"]').select("Alimentación");
      cy.contains("button", "Confirmar").click();
    });
    cy.get('section[aria-label="Movimientos por confirmar"]').should("not.exist");

    cy.task("dbQuery", "select c.name as category from transactions t join categories c on c.id = t.category_id where t.name = 'Zzxq Tienda Rara'").then((rows) => {
      expect((rows as { category: string }[])[0].category).to.eq("Alimentación");
    });
    cy.task("dbQuery", "select decision from transaction_reviews where topic = 'capture_confirmation'").then((rows) => {
      expect((rows as { decision: string }[]).map((row) => row.decision)).to.include("confirmed");
    });
  });

  it("acepta la notificación del banco en texto plano, la entiende con reglas y la guarda con su texto original", () => {
    cy.visit("/settings");
    cy.contains("button", /Generar/).click();
    cy.get("[role=status] code")
      .invoke("text")
      .then((token) => {
        const notification = "Compra con TDD\nCompra con CUENTA en ANTHROPIC* CLAUDE $349.00 06 octubre 12:44h";
        cy.request({ method: "POST", url: `${API}?account=Nu%20D%C3%A9bito`, headers: { ...bearer(token), "Content-Type": "text/plain" }, body: notification }).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body).to.include({ ok: true, cuenta: "Nu Débito", monto: -349, descripcion: "ANTHROPIC* CLAUDE" });
        });
        cy.request({ method: "POST", url: API, headers: { ...bearer(token), "Content-Type": "text/plain" }, body: notification, failOnStatusCode: false }).its("status").should("eq", 400);
        cy.task("dbQuery", "select notes from transactions where name = 'ANTHROPIC* CLAUDE'").then((rows) => {
          expect((rows as { notes: string }[])[0].notes).to.eq(notification);
        });
      });
  });

  it("al generar un token nuevo el anterior deja de servir", () => {
    cy.visit("/settings");
    cy.contains("button", /Generar/).click();
    cy.get("[role=status] code")
      .invoke("text")
      .then((first) => {
        cy.visit("/settings");
        cy.contains("button", "Generar uno nuevo").click();
        cy.get("[role=status] code").should("not.have.text", first);
        cy.request({ method: "POST", url: API, headers: bearer(first), body: { account: "Nu Débito", type: "expense", amount: 1, description: "x" }, failOnStatusCode: false }).its("status").should("eq", 401);
      });
  });
});
