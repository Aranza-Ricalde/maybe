const theme = () => cy.document().its("documentElement").invoke("getAttribute", "data-theme");

describe("Apariencia — tema claro, oscuro y sistema", () => {
  beforeEach(() => {
    cy.clearCookie("maybe-theme");
    cy.clearCookie("maybe-theme-resolved");
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
  });

  it("sin preferencia sigue al sistema operativo", () => {
    cy.visit("/settings", { onBeforeLoad: (win) => cy.stub(win, "matchMedia").callsFake((query: string) => ({ matches: query.includes("dark"), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList) });
    theme().should("eq", "dark");
    cy.getCookie("maybe-theme-resolved").should("have.property", "value", "dark");
  });

  it("elegir Oscuro y Claro cambia el tema, se guarda en una cookie y el servidor lo pinta desde la primera respuesta", () => {
    cy.visit("/settings");
    cy.contains("button", "Oscuro").click();
    theme().should("eq", "dark");
    cy.getCookie("maybe-theme").should("have.property", "value", "dark");
    cy.reload();
    theme().should("eq", "dark");
    cy.getCookie("access_token").then((cookie) => {
      cy.request({ url: "/settings", headers: { cookie: `access_token=${cookie?.value}; maybe-theme=dark; maybe-theme-resolved=dark` } }).its("body").should("match", /<html[^>]*data-theme="dark"/);
    });

    cy.contains("button", "Claro").click();
    theme().should("eq", "light");
    cy.getCookie("maybe-theme").should("have.property", "value", "light");
    cy.reload();
    theme().should("eq", "light");

    cy.contains("button", "Sistema").click();
    cy.getCookie("maybe-theme").should("have.property", "value", "system");
  });
});
