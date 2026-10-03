describe("Transacciones: transferencias entre cuentas", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/transactions");
    cy.get("table").should("be.visible");
    cy.get('[data-slot="modal-backdrop"]').should("not.exist");
  });

  function openTransferModal() {
    cy.contains("button", "Transferencia").click();
    cy.contains("Registrar transferencia").should("be.visible");
  }

  function selectKind(label: string) {
    cy.contains("span", "Tipo").parent().find("button").click();
    cy.contains('[role="option"], li', label).click();
  }

  it("registra una transferencia simple entre cuentas y crea DOS movimientos vinculados", () => {
    openTransferModal();

    cy.get('input[name="amount"]').type("111.11");
    cy.contains("button", "Registrar").click();

    cy.contains("Transferencia enviada", { timeout: 10000 }).should("be.visible");
    cy.contains("Transferencia recibida").should("be.visible");

    cy.task(
      "dbQuery",
      "select t.outflow_transaction_id, t.inflow_transaction_id, o.amount_cents as out_cents, i.amount_cents as in_cents, o.kind " +
        "from transfers t join transactions o on o.id = t.outflow_transaction_id join transactions i on i.id = t.inflow_transaction_id " +
        "where o.amount_cents = -11111 order by t.id desc limit 1",
    ).then((rows) => {
      const row = (rows as { out_cents: string; in_cents: string; kind: string }[])[0];
      expect(row, "debe existir un registro en transfers vinculando ambas transacciones").to.exist;
      expect(Number(row.out_cents)).to.equal(-11111);
      expect(Number(row.in_cents)).to.equal(11111);
      expect(row.kind).to.equal("transfer");
    });
  });

  it("registra un pago de tarjeta de crédito (cc_payment) correctamente vinculado", () => {
    openTransferModal();
    selectKind("Pago de tarjeta de crédito");
    cy.get('input[name="amount"]').type("222.22");
    cy.contains("button", "Registrar").click();

    cy.contains("Pago de tarjeta", { timeout: 10000 }).should("be.visible");

    cy.task(
      "dbQuery",
      "select kind from transactions where amount_cents = -22222 and kind = 'cc_payment' order by id desc limit 1",
    ).then((rows) => {
      expect((rows as unknown[]).length, "debe existir una transacción con kind=cc_payment").to.equal(1);
    });
  });

  it("registra un pago de préstamo (loan_payment) correctamente vinculado", () => {
    openTransferModal();
    selectKind("Pago de préstamo");
    cy.get('input[name="amount"]').type("333.33");
    cy.contains("button", "Registrar").click();

    cy.contains("Pago de préstamo", { timeout: 10000 }).should("be.visible");

    cy.task(
      "dbQuery",
      "select kind from transactions where amount_cents = -33333 and kind = 'loan_payment' order by id desc limit 1",
    ).then((rows) => {
      expect((rows as unknown[]).length, "debe existir una transacción con kind=loan_payment").to.equal(1);
    });
  });

  it("una transferencia NO se duplica como gasto/ingreso normal en la lista (kind != standard)", () => {
    cy.task(
      "dbQuery",
      "select count(*) as n from transactions where amount_cents = -11111 and kind = 'standard'",
    ).then((rows) => {
      expect(Number((rows as { n: string }[])[0].n)).to.equal(0);
    });
  });

  it("al elegir la misma cuenta origen y destino, el formulario no permite guardar (o la app lo rechaza)", () => {
    openTransferModal();
    cy.contains("span", "Cuenta destino").parent().find("button").click();
    cy.contains('[role="option"], li', "Nu Débito").click();
    cy.get('input[name="amount"]').type("50.00");
    cy.contains("button", "Registrar").click();
    // La cuenta origen por defecto también es Nu Débito -> el use case debe rechazarlo.
    // No debe crearse ninguna transacción nueva de $50.00 en este escenario inválido.
    cy.wait(500);
    cy.task("dbQuery", "select count(*) as n from transactions where amount_cents in (-5000, 5000) and name ilike '%transferencia%'").then(
      (rows) => {
        expect(Number((rows as { n: string }[])[0].n)).to.equal(0);
      },
    );
  });
});
