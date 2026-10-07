import type { PdfTextExtractor } from "@/domain/statements/ports";
import type { PdfWord } from "@/domain/statements/types";
import { extractPdfWords } from "./pdfWordExtractor";

export class UnpdfTextExtractor implements PdfTextExtractor {
  extract(data: Uint8Array, password?: string): Promise<PdfWord[]> {
    return extractPdfWords(data, password);
  }
}
