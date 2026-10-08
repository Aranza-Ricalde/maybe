const openDetail = (name: string) => cy.contains("li", name).find('button[aria-label^="Ver detalle"]').click();
const inDetail = (run: () => void) => cy.get('[data-slot="dialog-content"]').first().within(run);

const GRID = "main ul";

describe("/accounts — crear, editar, archivar/restaurar", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/accounts");
  });

  it("el selector de tipo de cuenta en 'Nueva cuenta' incluye todos los tipos soportados", () => {
    cy.contains("button", "+ Nueva cuenta").click();
    cy.contains("Nueva cuenta").should("be.visible");
    cy.get('[role="dialog"] [role="combobox"]').first().click();
    for (const label of ["Cuenta de cheques", "Ahorro", "Tarjeta de crédito", "Efectivo", "Préstamo", "Propiedad", "Vehículo", "Otro activo", "Otro pasivo"]) {
      cy.contains('[role="option"], li', label).should("exist");
    }
    cy.get("body").type("{esc}");
    cy.get('[data-slot="dialog-close"]').click();
  });

  it("crea una cuenta nueva, aparece en la tabla con saldo $0.00, y queda persistida en la base", () => {
    const name = `E2E Cuenta ${Date.now()}`;

    cy.contains("button", "+ Nueva cuenta").click();
    cy.get('input[name="name"]').type(name);
    cy.contains("button", "Crear cuenta").click();

    cy.contains("li", name).should("be.visible").within(() => {
      cy.contains("$0.00").should("be.visible");
    });

    cy.task("dbQuery", `select name, type, is_active from accounts where name = '${name}'`).then((rows) => {
      const list = rows as { name: string; type: string; is_active: boolean }[];
      expect(list).to.have.length(1);
      expect(list[0].type).to.equal("checking");
      expect(list[0].is_active).to.equal(true);
    });

    // limpieza: esta cuenta no tiene actividad -> el botón de eliminar la borra de verdad (no la archiva).
    openDetail(name);
    inDetail(() => cy.get('button[aria-label^="Eliminar"]').click());
    cy.contains("button", "Sí, eliminar").click();
    cy.contains("li", name).should("not.exist");
    cy.task("dbQuery", `select count(*)::int as n from accounts where name = '${name}'`).then((rows) => {
      expect((rows as { n: number }[])[0].n).to.equal(0);
    });
  });

  it("crea una cuenta de tipo tarjeta de crédito con límite y lo guarda correctamente", () => {
    const name = `E2E TDC ${Date.now()}`;

    cy.contains("button", "+ Nueva cuenta").click();
    cy.get('input[name="name"]').type(name);
    cy.chooseOption("Tipo", "Tarjeta de crédito");
    cy.get('input[name="creditLimitCents"]').type("15000");
    cy.contains("button", "Crear cuenta").click();

    cy.contains("li", name).should("be.visible");
    cy.task("dbQuery", `select type, details from accounts where name = '${name}'`).then((rows) => {
      const row = (rows as { type: string; details: { creditLimitCents?: number } | null }[])[0];
      expect(row.type).to.equal("credit_card");
      expect(row.details?.creditLimitCents).to.equal(1500000);
    });

    openDetail(name);
    inDetail(() => cy.get('button[aria-label^="Eliminar"]').click());
    cy.contains("button", "Sí, eliminar").click();
  });

  it("crea una cuenta de tipo tarjeta de débito: queda con ese tipo, se muestra con su etiqueta y no es un pasivo", () => {
    const name = `E2E Débito ${Date.now()}`;

    cy.contains("button", "+ Nueva cuenta").click();
    cy.get('input[name="name"]').type(name);
    cy.chooseOption("Tipo", "Tarjeta de débito");
    cy.contains("button", "Crear cuenta").click();

    cy.contains("li", name).should("be.visible").within(() => {
      cy.contains("Tarjeta de débito").should("be.visible");
      cy.contains("$0.00").should("be.visible");
    });
    cy.task("dbQuery", `select type from accounts where name = '${name}'`).then((rows) => {
      expect((rows as { type: string }[])[0].type).to.equal("debit_card");
    });

    openDetail(name);
    inDetail(() => cy.get('button[aria-label^="Eliminar"]').click());
    cy.contains("button", "Sí, eliminar").click();
    cy.contains("li", name).should("not.exist");
  });

  it("edita el nombre de una cuenta existente y lo refleja en la base", () => {
    const name = `E2E Editar ${Date.now()}`;
    const renamed = `${name} (editada)`;

    cy.contains("button", "+ Nueva cuenta").click();
    cy.get('input[name="name"]').type(name);
    cy.contains("button", "Crear cuenta").click();
    cy.contains("li", name).should("be.visible");

    openDetail(name);
    inDetail(() => cy.get('button[aria-label="Editar cuenta"]').click());
    cy.contains("Editar cuenta").should("be.visible");
    cy.get('input[name="name"]').clear().type(renamed);
    cy.contains("button", "Guardar cambios").click();

    cy.contains("li", renamed).should("exist");
    cy.task("dbQuery", `select name from accounts where name = '${renamed}'`).then((rows) => {
      expect(rows).to.have.length(1);
    });

    inDetail(() => cy.get('button[aria-label^="Eliminar"]').click());
    cy.contains("button", "Sí, eliminar").click();
  });

  it("el modal de eliminar advierte que, si la cuenta tiene movimientos, se archiva en vez de borrarse", () => {
    openDetail("Nu Débito");
    inDetail(() => cy.get('button[aria-label^="Eliminar"]').click());
    cy.contains("se archivará en vez de borrarse").should("be.visible");
    cy.get("body").type("{esc}{esc}");
  });

  it("restaura la cuenta archivada 'Efectivo': reaparece activa en la tabla y en la base", () => {
    cy.contains(/Ver cuentas archivadas/).click();
    cy.contains("li", "Efectivo").within(() => cy.contains("button", "Reactivar").click());

    cy.get(GRID, { timeout: 10000 }).contains("li", "Efectivo").should("be.visible");
    cy.task("dbQuery", `select is_active from accounts where name = 'Efectivo'`).then((rows) => {
      expect((rows as { is_active: boolean }[])[0].is_active).to.equal(true);
    });

    // deja la base como estaba para no afectar otras corridas: re-archiva (ya tiene actividad -> se archiva, no se borra).
    cy.get(GRID).contains("li", "Efectivo").find('button[aria-label^="Ver detalle"]').click();
    inDetail(() => cy.get('button[aria-label^="Eliminar"]').click());
    cy.contains("button", "Sí, eliminar").click();
    cy.get(GRID).find("li").should("not.contain", "Efectivo");
    cy.task("dbQuery", `select is_active from accounts where name = 'Efectivo'`).then((rows) => {
      expect((rows as { is_active: boolean }[])[0].is_active).to.equal(false);
    });
  });
});
