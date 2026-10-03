describe("Autenticación: login, logout, rutas protegidas", () => {
  it("una ruta protegida sin sesión redirige a /login", () => {
    cy.clearCookies();
    cy.visit("/accounts");
    cy.location("pathname").should("eq", "/login");
  });

  it("login con credenciales correctas entra al dashboard", () => {
    cy.clearCookies();
    cy.visit("/login");
    cy.get('input[name="email"]').type("e2e@test.local");
    cy.get('input[name="password"]').type("e2e-test-password-123");
    cy.contains("button", "Entrar").click();

    cy.location("pathname", { timeout: 10000 }).should("eq", "/");
    cy.contains(/E2E Tester/i).should("exist");
  });

  it("login con contraseña incorrecta muestra error y NO entra", () => {
    cy.clearCookies();
    cy.visit("/login");
    cy.get('input[name="email"]').type("e2e@test.local");
    cy.get('input[name="password"]').type("contraseña-incorrecta");
    cy.contains("button", "Entrar").click();

    cy.location("pathname").should("eq", "/login");
    cy.location("search").should("include", "error=1");
    cy.contains("Email o contraseña incorrectos.").should("be.visible");
  });

  it("login con email inexistente muestra el mismo error genérico (no filtra si el usuario existe)", () => {
    cy.clearCookies();
    cy.visit("/login");
    cy.get('input[name="email"]').type("no-existe@test.local");
    cy.get('input[name="password"]').type("lo-que-sea-123");
    cy.contains("button", "Entrar").click();

    cy.location("pathname").should("eq", "/login");
    cy.contains("Email o contraseña incorrectos.").should("be.visible");
  });

  it("el formulario de login exige email y contraseña (validación HTML required)", () => {
    cy.clearCookies();
    cy.visit("/login");
    cy.get('input[name="email"]').then(($el) => {
      expect($el.prop("required")).to.equal(true);
    });
    cy.get('input[name="password"]').then(($el) => {
      expect($el.prop("required")).to.equal(true);
    });
  });

  it("estando logueado, /login redirige directo al dashboard", () => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/login");
    cy.location("pathname").should("eq", "/");
  });

  it("logout (tras un login real, con sesión en base) invalida la sesión y borra el refresh token de la base", () => {
    cy.clearCookies();
    cy.visit("/login");
    cy.get('input[name="email"]').type("e2e@test.local");
    cy.get('input[name="password"]').type("e2e-test-password-123");
    cy.contains("button", "Entrar").click();
    cy.location("pathname", { timeout: 10000 }).should("eq", "/");

    cy.task("dbQuery", "select count(*)::int as n from sessions").then((rows) => {
      expect((rows as { n: number }[])[0].n).to.be.greaterThan(0);
    });

    cy.get('form[action="/api/logout"] button[type="submit"]').click();
    cy.location("pathname", { timeout: 10000 }).should("eq", "/login");

    cy.task("dbQuery", "select count(*)::int as n from sessions").then((rows) => {
      expect((rows as { n: number }[])[0].n).to.equal(0);
    });

    cy.visit("/accounts");
    cy.location("pathname").should("eq", "/login");
  });
});
