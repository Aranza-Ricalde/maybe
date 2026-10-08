const FIRST_MONTH_END = `select max("end")::text as value from pay_periods where to_char("end",'YYYY-MM') = (select min(to_char("end",'YYYY-MM')) from pay_periods)`;
const SECOND_MONTH_PREVIOUS_END = `select max("end")::text as value from pay_periods where to_char("end",'YYYY-MM') = (select min(to_char("end",'YYYY-MM')) from pay_periods)`;

const shiftDay = (iso: string, delta: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
};

const readValue = (sql: string) => cy.task("dbQuery", sql).then((rows) => (rows as { value: string }[])[0].value);

const editMonth = (rowIndex: number, change: { start?: string; end?: string }) => {
  cy.get('[aria-label="Meses de pago"]').within(() => cy.get('button[aria-label^="Editar"]').eq(rowIndex).click());
  if (change.start) cy.get('input[name="start"]').invoke("val", change.start);
  if (change.end) cy.get('input[name="end"]').invoke("val", change.end);
  cy.contains("button", "Guardar cambios").click();
};

describe("Settings — Meses de pago", () => {
  before(() => {
    cy.task("setPeriodView", "monthly");
  });

  beforeEach(() => {
    cy.task("mintAccessToken", 1).then((token) => cy.setCookie("access_token", token as string));
    cy.visit("/settings?s=periodos");
  });

  it("guardar un mes de pago lo actualiza en la base y avisa que salió bien; deshacerlo también", () => {
    readValue(FIRST_MONTH_END).then((originalEnd) => {
      const shrunk = shiftDay(originalEnd, -1);

      editMonth(0, { end: shrunk });
      cy.contains("[data-sonner-toast]", "Mes de pago actualizado", { timeout: 10000 }).should("be.visible");
      readValue(FIRST_MONTH_END).should("equal", shrunk);

      cy.visit("/settings?s=periodos");
      editMonth(0, { end: originalEnd });
      cy.contains("[data-sonner-toast]", "Mes de pago actualizado", { timeout: 10000 }).should("be.visible");
      readValue(FIRST_MONTH_END).should("equal", originalEnd);
    });
  });

  it("si el cambio se traslapa con el mes anterior no se guarda, avisa por qué y el modal sigue abierto", () => {
    readValue(SECOND_MONTH_PREVIOUS_END).then((previousEnd) => {
      editMonth(1, { start: previousEnd });
      cy.contains("[data-sonner-toast]", "se traslapa", { timeout: 10000 }).should("be.visible");
      cy.get('[role="dialog"]').should("be.visible");
    });
  });
});
