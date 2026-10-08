export {};
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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      chooseOption(label: string, option: string): Chainable<void>;
      choosePeriod(label: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("chooseOption", (label: string, option: string) => {
  cy.contains('[data-slot="field"] [data-slot="field-label"]', label).closest('[data-slot="field"]').find('[role="combobox"]').click();
  cy.contains('[role="option"]', option).click();
});

Cypress.Commands.add("choosePeriod", (label: string) => {
  cy.get('[aria-label="Elegir periodo"]').click();
  cy.contains('[data-slot="popover-content"] button', label).click();
});
