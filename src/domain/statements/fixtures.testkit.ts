import type { PdfWord } from "./types";

const CHAR_WIDTH = 5;
const WORD_GAP = 3;
const LINE_HEIGHT = 9;

export type Cell = [x: number, text: string];

export class PageBuilder {
  readonly words: PdfWord[] = [];
  private cursor = 40;

  constructor(private readonly page: number) {}

  skip(points = LINE_HEIGHT * 2): this {
    this.cursor += points;
    return this;
  }

  line(...cells: Cell[]): this {
    this.cursor += LINE_HEIGHT + 3;
    for (const [x, text] of cells) this.put(x, text, this.cursor);
    return this;
  }

  lineOffset(offset: number, ...cells: Cell[]): this {
    for (const [x, text] of cells) this.put(x, text, this.cursor + offset);
    return this;
  }

  rightAligned(x1: number, text: string, offset = 0): this {
    const width = text.length * CHAR_WIDTH;
    this.words.push({ page: this.page, x0: x1 - width, x1, top: this.cursor + offset, bottom: this.cursor + offset + LINE_HEIGHT, text });
    return this;
  }

  private put(x: number, text: string, top: number): void {
    let cursor = x;
    for (const token of text.split(" ").filter(Boolean)) {
      const width = token.length * CHAR_WIDTH;
      this.words.push({ page: this.page, x0: cursor, x1: cursor + width, top, bottom: top + LINE_HEIGHT, text: token });
      cursor += width + WORD_GAP;
    }
  }
}

export function pages(...builders: PageBuilder[]): PdfWord[] {
  return builders.flatMap((b) => b.words);
}

export const page = (number: number) => new PageBuilder(number);
