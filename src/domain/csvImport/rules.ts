export class CsvRowError extends Error {}

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const rawRows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rawRows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\r") {
    } else if (char === "\n") {
      pushRow();
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();

  const nonEmptyRows = rawRows.filter((r) => !(r.length === 1 && r[0] === ""));
  const [headerRow, ...dataRows] = nonEmptyRows;
  if (!headerRow) return { headers: [], rows: [] };

  const headers = headerRow.map((h) => h.trim());
  const rows = dataRows.map((cols) => {
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = (cols[idx] ?? "").trim();
    });
    return record;
  });
  return { headers, rows };
}

export function bankSignature(headers: string[]): string {
  return headers.map((h) => h.trim().toLowerCase()).join("|");
}

export interface ColumnMapping {
  date: string;
  amount: string;
  name: string;
  notes?: string;
}

export interface MappedCsvTransaction {
  date: string;
  amountCents: number;
  name: string;
  rawDescription: string;
  notes?: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const US_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function parseCsvDate(raw: string): string {
  if (ISO_DATE.test(raw)) return raw;
  const m = raw.match(US_DATE);
  if (m) {
    const [, mo, d, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  throw new CsvRowError(`formato de fecha no reconocido: "${raw}" (se soporta YYYY-MM-DD o MM/DD/YYYY)`);
}

function parseCsvAmount(raw: string): number {
  let s = raw.trim().replace(/[^0-9.\-()]/g, "");
  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  const value = Number(s);
  if (Number.isNaN(value) || s === "") {
    throw new CsvRowError(`monto no numérico: "${raw}"`);
  }
  const cents = Math.round(Math.abs(value) * 100);
  return negative || value < 0 ? -cents : cents;
}

export function mapRowToTransaction(row: Record<string, string>, mapping: ColumnMapping): MappedCsvTransaction {
  const rawDate = row[mapping.date];
  const rawAmount = row[mapping.amount];
  const rawName = row[mapping.name];
  if (rawDate == null || rawAmount == null || rawName == null) {
    throw new CsvRowError(`faltan columnas mapeadas (date="${mapping.date}", amount="${mapping.amount}", name="${mapping.name}") en la fila`);
  }

  return {
    date: parseCsvDate(rawDate),
    amountCents: parseCsvAmount(rawAmount),
    name: rawName,
    rawDescription: rawName,
    notes: mapping.notes ? row[mapping.notes] : undefined,
  };
}
