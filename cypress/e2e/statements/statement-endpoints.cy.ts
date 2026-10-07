interface UploadOptions {
  endpoint: "parse" | "confirm";
  bytes?: Uint8Array | string;
  type?: string;
  fields?: Record<string, string>;
}

function upload(win: Window, { endpoint, bytes, type = "application/pdf", fields = {} }: UploadOptions): Promise<{ status: number; body: Record<string, unknown> }> {
  const form = new FormData();
  if (bytes !== undefined) form.append("file", new Blob([bytes as BlobPart], { type }), "estado.pdf");
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return win.fetch(`/api/statements/${endpoint}`, { method: "POST", body: form }).then(async (response) => ({ status: response.status, body: (await response.json()) as Record<string, unknown> }));
}

const MINIMAL_PDF = "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF";
const VALID = { bank: "bbva_debito", accountId: "1" };

describe("Importación de estados de cuenta — endpoints", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/settings");
  });

  it("rechaza lo que no es un PDF válido, el banco o la cuenta inválidos y los archivos grandes", () => {
    cy.window().then(async (win) => {
      const noFile = await upload(win, { endpoint: "parse", fields: VALID });
      expect(noFile.status).to.eq(400);

      const wrongType = await upload(win, { endpoint: "parse", bytes: MINIMAL_PDF, type: "text/plain", fields: VALID });
      expect(wrongType.status).to.eq(415);

      const fakePdf = await upload(win, { endpoint: "parse", bytes: "no soy un pdf", fields: VALID });
      expect(fakePdf.status).to.eq(415);

      const badBank = await upload(win, { endpoint: "parse", bytes: MINIMAL_PDF, fields: { ...VALID, bank: "banco_inventado" } });
      expect(badBank.status).to.eq(400);

      const badAccount = await upload(win, { endpoint: "parse", bytes: MINIMAL_PDF, fields: { ...VALID, accountId: "999999" } });
      expect(badAccount.status).to.eq(404);
      expect(badAccount.body.error).to.eq("cuenta_invalida");

      const tooBig = await upload(win, { endpoint: "parse", bytes: new Uint8Array(4 * 1024 * 1024 + 1), fields: VALID });
      expect(tooBig.status).to.eq(413);
    });
  });

  it("un PDF sin formato de estado devuelve un error claro y no guarda nada", () => {
    cy.task("dbQuery", "select count(*)::int as n from transactions").then((before) => {
      cy.window().then(async (win) => {
        const parse = await upload(win, { endpoint: "parse", bytes: MINIMAL_PDF, fields: VALID });
        expect(parse.status).to.eq(422);
        expect(parse.body.ok).to.eq(false);
        const confirm = await upload(win, { endpoint: "confirm", bytes: MINIMAL_PDF, fields: { ...VALID, decisions: "[]" } });
        expect(confirm.status).to.eq(422);
        const badDecisions = await upload(win, { endpoint: "confirm", bytes: MINIMAL_PDF, fields: { ...VALID, decisions: "{no es json" } });
        expect(badDecisions.status).to.eq(400);
      });
      cy.task("dbQuery", "select count(*)::int as n from transactions").should("deep.equal", before);
    });
  });

  it("sin sesión no procesa el archivo", () => {
    cy.clearCookies();
    cy.request({ method: "POST", url: "/api/statements/parse", failOnStatusCode: false, followRedirect: false }).its("status").should("be.oneOf", [302, 307, 401]);
  });
});
