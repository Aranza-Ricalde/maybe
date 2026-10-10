export {};

const BASE_URL = "http://localhost:3011";
const PDF = "%PDF-1.4\n% estado de prueba para la bandeja\n";

function withToken(run: (token: string) => void) {
  cy.visit("/settings?s=integraciones");
  cy.contains("button", /Generar/).click();
  cy.get("[role=status] code").invoke("text").then(run);
}

describe("Estados de cuenta por correo: bandeja de pendientes", () => {
  beforeEach(() => {
    cy.task("cleanupStatementInbox");
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  after(() => {
    cy.task("cleanupStatementInbox");
    cy.task("cleanupApiCapture");
  });

  it("recibe el PDF, avisa en la campana, lo lista en Importar y evita duplicados", () => {
    withToken((token) => {
      const upload = (overrides: Record<string, string> = {}) =>
        cy.task("uploadInboxStatement", { baseUrl: BASE_URL, token, filename: "1568871032_202610.pdf", bank: "bbva_debito", account: "Nu Débito", content: PDF, ...overrides });

      upload().then((result) => {
        const { status, body } = result as { status: number; body: { estado: string } };
        expect(status).to.eq(201);
        expect(body.estado).to.eq("recibido");
      });
      upload().then((result) => {
        const { status, body } = result as { status: number; body: { estado: string } };
        expect(status).to.eq(200);
        expect(body.estado).to.eq("duplicado");
      });
      upload({ content: "no es un pdf" }).then((result) => expect((result as { status: number }).status).to.eq(422));
      upload({ bank: "otro", content: `${PDF}x` }).then((result) => expect((result as { status: number }).status).to.eq(422));
      upload({ account: "Cuenta inexistente", content: `${PDF}y` }).then((result) => expect((result as { status: number }).status).to.eq(404));
    });

    cy.task("dbQuery", "select count(*)::int as n from statement_inbox where status = 'pending'").then((rows) => expect((rows as { n: number }[])[0].n).to.eq(1));
    cy.task("dbQuery", "select count(*)::int as n from notification_events where type = 'statement_ready'").then((rows) => expect((rows as { n: number }[])[0].n).to.be.greaterThan(0));

    cy.visit("/import");
    cy.get('[aria-label="Estados pendientes de importar"]').within(() => {
      cy.contains("BBVA Libretón").should("be.visible");
      cy.contains("1568871032_202610.pdf").should("be.visible");
      cy.contains("button", "Revisar").should("be.visible");
      cy.contains("button", "Descartar").click();
    });
    cy.get('[aria-label="Estados pendientes de importar"]').should("not.exist");
    cy.task("dbQuery", "select status from statement_inbox").then((rows) => expect((rows as { status: string }[])[0].status).to.eq("dismissed"));
  });

  it("al revisar un pendiente deja de listarse aunque cambies de pantalla, y vuelve si lo quitas de la cola", () => {
    withToken((token) => {
      cy.task("uploadInboxStatement", { baseUrl: BASE_URL, token, filename: "1568871032_202612.pdf", bank: "bbva_debito", account: "Nu Débito", content: `${PDF}cola` });
    });
    cy.visit("/import");
    cy.get('[aria-label="Estados pendientes de importar"]').within(() => cy.contains("button", "Revisar").click());
    cy.get('[aria-label="Estados pendientes de importar"]').should("not.exist");
    cy.contains("nav a", "Resumen").click();
    cy.contains("nav a", "Importar estados").click();
    cy.contains("h1", "Importar estados de cuenta");
    cy.get('[aria-label="Estados pendientes de importar"]').should("not.exist");
    cy.contains("button", "Quitar").click();
    cy.get('[aria-label="Estados pendientes de importar"]').should("be.visible");
  });

  it("sin token válido no se acepta el archivo", () => {
    cy.task("uploadInboxStatement", { baseUrl: BASE_URL, token: "mv_incorrecto-pero-con-longitud-suficiente", filename: "a.pdf", bank: "bbva_debito", account: "Nu Débito", content: PDF }).then((result) => {
      expect((result as { status: number }).status).to.eq(401);
    });
  });

  it("en móvil las acciones ocupan el ancho y el aviso se ve en la lista", () => {
    cy.viewport(390, 844);
    withToken((token) => {
      cy.task("uploadInboxStatement", { baseUrl: BASE_URL, token, filename: "1568871032_202611.pdf", bank: "bbva_debito", account: "Nu Débito", content: `${PDF}movil` });
    });
    cy.visit("/import");
    cy.get('[aria-label="Estados pendientes de importar"]').should("be.visible").within(() => {
      cy.contains("button", "Revisar").should("be.visible").invoke("outerWidth").should("be.greaterThan", 120);
    });
  });
});
