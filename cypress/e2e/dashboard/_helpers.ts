export const E2E_FAMILY_ID = 1;

export function loginAsE2EUser(): void {
  cy.task("mintAccessToken", E2E_FAMILY_ID).then((token) => {
    cy.setCookie("access_token", token as string);
  });
}

export function dbQuery<T = Record<string, unknown>>(query: string): Cypress.Chainable<T[]> {
  return cy.task("dbQuery", query) as Cypress.Chainable<T[]>;
}
