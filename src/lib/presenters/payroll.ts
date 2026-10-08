export function describePaydays(days: number[]): string {
  if (days.length === 0) return "";
  if (days.length === 1) return `el día ${days[0]}`;
  const sorted = [...days].sort((a, b) => a - b);
  return `los días ${sorted.slice(0, -1).join(", ")} y ${sorted[sorted.length - 1]}`;
}

export function parseDayInput(value: string): number | null {
  const day = Number(value);
  return value.trim() !== "" && Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}
