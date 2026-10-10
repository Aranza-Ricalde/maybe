describe("/accounts — lista, saldos y detalle", () => {
  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/accounts");
  });

  it("muestra el encabezado y el botón de nueva cuenta", () => {
    cy.contains("h1, h2, h3", "Cuentas").should("be.visible");
    cy.contains("button", "+ Nueva cuenta").should("be.visible");
  });

  it("lista las 4 cuentas activas con su tipo correcto (Efectivo está archivada y NO debe aparecer)", () => {
    const expected: Record<string, string> = {
      "Nu Débito": "Cuenta de cheques",
      "Nu Ahorro": "Ahorro",
      "Nu TDC": "Tarjeta de crédito",
      "Préstamo Auto": "Préstamo",
    };
    for (const [name, typeLabel] of Object.entries(expected)) {
      cy.contains("li", name).within(() => {
        cy.contains(typeLabel).should("be.visible");
      });
    }
    cy.contains("li", "Efectivo").should("not.exist");
  });

  it("el saldo mostrado de cada cuenta coincide EXACTAMENTE con la base de datos", () => {
    cy.task("dbQuery", `
      select a.id, a.name,
        coalesce((select balance_cents from account_balances_daily d where d.account_id = a.id order by d.date desc limit 1), 0) as balance_cents
      from accounts a where a.is_active = true order by a.id
    `).then((rows) => {
      const list = rows as { id: number; name: string; balance_cents: string }[];
      expect(list.length).to.equal(4);
      for (const acc of list) {
        const cents = Number(acc.balance_cents);
        const formatted = (Math.abs(cents) / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
        cy.contains("li", acc.name).within(() => {
          cy.contains(formatted.replace(/\s/g, "")).should("exist");
        });
      }
    });
  });

  it("el signo del saldo de la tarjeta de crédito (Nu TDC) coincide con la base: negativo solo si hay deuda", () => {
    cy.task("dbQuery", "select balance_cents from account_balances_daily where account_id = (select id from accounts where name = 'Nu TDC') order by date desc limit 1").then((rows) => {
      const cents = Number((rows as { balance_cents: string }[])[0].balance_cents);
      cy.contains("li", "Nu TDC").within(() => {
        if (cents < 0) cy.contains("-$").should("exist");
        else cy.contains("-$").should("not.exist");
      });
    });
  });

  it("el link de cuentas archivadas muestra el conteo correcto y abre el modal con Efectivo", () => {
    cy.contains(/Ver cuentas archivadas \(1\)/).click();
    cy.contains("Cuentas archivadas").should("be.visible");
    cy.contains("Se archivaron, no se borraron").should("be.visible");
    cy.contains("li", "Efectivo").within(() => {
      cy.contains("Efectivo").should("be.visible");
      cy.contains("button", "Reactivar").should("be.visible");
    });
    cy.get('[data-slot="dialog-close"]').click();
    cy.contains("Cuentas archivadas").should("not.exist");
  });

  it("muestra el patrimonio neto y agrupa las cuentas por tipo con su subtotal", () => {
    cy.contains("Patrimonio neto").should("be.visible");
    cy.get('section[aria-label="Efectivo, ahorro y activos"]').contains("li", "Nu Débito").should("be.visible");
    cy.get('section[aria-label="Tarjetas de crédito"]').contains("li", "Nu TDC").should("be.visible");
    cy.get('section[aria-label="Préstamos y otros pasivos"]').contains("li", "Préstamo Auto").should("be.visible");
    cy.contains("button", "Crédito").should("not.exist");
  });

  it("al abrir una cuenta se ve su saldo, la gráfica y sus movimientos", () => {
    cy.get('button[aria-label="Ver detalle de Nu Débito"]').click();
    cy.get('[data-slot="dialog-content"]').within(() => {
      cy.contains("Movimientos recientes").should("be.visible");
      cy.contains("Todavía no hay suficientes datos para graficar esta cuenta.").should("not.exist");
      cy.get("svg").should("exist");
    });
  });

  it("el detalle permite cambiar de rango (30 días / 3 meses / 6 meses / 1 año)", () => {
    cy.get('button[aria-label="Ver detalle de Nu Débito"]').click();
    cy.get('[data-slot="dialog-content"]').within(() => {
      for (const label of ["30 días", "3 meses", "6 meses", "1 año"]) {
        cy.contains("button", label).click();
        cy.contains("button", label).should("have.attr", "data-active");
      }
    });
  });

  it("el detalle de una tarjeta lista sus movimientos y los datos de la deuda", () => {
    cy.get('button[aria-label="Ver detalle de Nu TDC"]').click();
    cy.get('[data-slot="dialog-content"]').within(() => {
      cy.contains("Amazon").should("be.visible");
      cy.contains("section", "Deuda").should("be.visible");
    });
  });
});
