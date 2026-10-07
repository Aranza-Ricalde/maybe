import { getDocumentProxy } from "unpdf";
import { StatementFormatError, StatementPasswordError, type PdfWord } from "@/domain/statements/types";

export const MAX_PDF_PAGES = 60;
export const MAX_PDF_WORDS = 60_000;
const PDF_VERBOSITY_ERRORS_ONLY = 0;

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

const isTextItem = (item: unknown): item is TextItem => typeof item === "object" && item !== null && "str" in item && "transform" in item;

function splitIntoWords(item: TextItem, pageNumber: number, pageHeight: number): PdfWord[] {
  const text = item.str;
  if (!text.trim()) return [];
  const [, , , , x, y] = item.transform;
  const top = pageHeight - y - item.height;
  const perChar = text.length > 0 ? item.width / text.length : 0;
  const words: PdfWord[] = [];
  for (const match of text.matchAll(/\S+/g)) {
    const start = match.index ?? 0;
    words.push({ page: pageNumber, x0: x + perChar * start, x1: x + perChar * (start + match[0].length), top, bottom: top + item.height, text: match[0] });
  }
  return words;
}

function translateError(error: unknown): Error {
  const name = error instanceof Error ? error.name : "";
  if (name === "PasswordException") return new StatementPasswordError("El PDF está protegido con contraseña.");
  if (name === "InvalidPDFException" || name === "FormatError" || name === "MissingPDFException") return new StatementFormatError("El archivo no es un PDF válido.");
  return error instanceof Error ? error : new Error("No se pudo leer el PDF.");
}

export async function extractPdfWords(data: Uint8Array, password?: string): Promise<PdfWord[]> {
  try {
    const document = await getDocumentProxy(data, { password, verbosity: PDF_VERBOSITY_ERRORS_ONLY });
    if (document.numPages > MAX_PDF_PAGES) throw new StatementFormatError(`El PDF tiene más de ${MAX_PDF_PAGES} páginas; no parece un estado de cuenta.`);
    const words: PdfWord[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const { height } = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      for (const item of content.items) if (isTextItem(item)) words.push(...splitIntoWords(item, pageNumber, height));
      if (words.length > MAX_PDF_WORDS) throw new StatementFormatError("El PDF tiene demasiado texto para ser un estado de cuenta.");
    }
    return words;
  } catch (error) {
    throw translateError(error);
  }
}
