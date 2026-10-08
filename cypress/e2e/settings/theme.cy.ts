const theme = () => cy.document().its("documentElement").invoke("getAttribute", "data-theme");

describe("Apariencia — tema claro, oscuro y sistema", () => {
  beforeEach(() => {
    cy.clearCookie("maybe-theme");
    cy.clearCookie("maybe-theme-resolved");
    cy.clearCookie("maybe-accent");
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("sin preferencia sigue al sistema operativo", () => {
    cy.visit("/settings?s=apariencia", { onBeforeLoad: (win) => cy.stub(win, "matchMedia").callsFake((query: string) => ({ matches: query.includes("dark"), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList) });
    theme().should("eq", "dark");
    cy.getCookie("maybe-theme-resolved").should("have.property", "value", "dark");
  });

  it("elegir Oscuro y Claro cambia el tema, se guarda en una cookie y el servidor lo pinta desde la primera respuesta", () => {
    cy.visit("/settings?s=apariencia");
    cy.contains("button", "Oscuro").click();
    theme().should("eq", "dark");
    cy.getCookie("maybe-theme").should("have.property", "value", "dark");
    cy.reload();
    theme().should("eq", "dark");
    cy.getCookie("access_token").then((cookie) => {
      cy.request({ url: "/settings?s=apariencia", headers: { cookie: `access_token=${cookie?.value}; maybe-theme=dark; maybe-theme-resolved=dark` } }).its("body").should("match", /<html[^>]*data-theme="dark"/);
    });

    cy.contains("button", "Claro").click();
    theme().should("eq", "light");
    cy.getCookie("maybe-theme").should("have.property", "value", "light");
    cy.reload();
    theme().should("eq", "light");

    cy.contains("button", "Sistema").click();
    cy.getCookie("maybe-theme").should("have.property", "value", "system");
  });

  it("el color de acento se elige en Configuración, se aplica de inmediato y se guarda al recargar", () => {
    const accent = () => cy.document().its("documentElement").invoke("getAttribute", "data-accent");
    cy.visit("/settings?s=apariencia");
    accent().should("eq", "teal");
    cy.get('button[aria-label="Azul"]').click();
    accent().should("eq", "blue");
    cy.getCookie("maybe-accent").should("have.property", "value", "blue");
    cy.reload();
    accent().should("eq", "blue");
    cy.get('button[aria-label="Azul"]').should("have.attr", "aria-pressed", "true");
    cy.get('button[aria-label="Negro"]').click();
    accent().should("eq", "neutral");
    cy.getCookie("maybe-accent").should("have.property", "value", "neutral");
  });
});
