Cypress.Commands.overwrite("visit", (originalFn, ...args: Parameters<typeof originalFn>) => {
  originalFn(...args);
  cy.document({ log: false }).should((doc) => {
    const interactive = doc.querySelector("button, a[href]");
    if (!interactive) return;
    const hydrated = Object.keys(interactive).some((key) => key.startsWith("__reactProps$"));
    expect(hydrated, "la página terminó de hidratarse").to.equal(true);
  });
  cy.wait(2500, { log: false });
});
