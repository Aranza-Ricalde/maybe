import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import { test } from "node:test";
import { StatementFormatError } from "@/domain/statements/types";
import { MAX_PDF_PAGES, extractPdfWords } from "./pdfWordExtractor";

function syntheticPdf(lines: Array<{ x: number; y: number; text: string }>, pageCount = 1): Uint8Array {
  const content = lines.map((l) => `BT /F1 10 Tf ${l.x} ${l.y} Td (${l.text}) Tj ET`).join("\n");
  const kids = Array.from({ length: pageCount }, (_, i) => `${6 + i} 0 R`).join(" ");
  const pageObjects = Array.from({ length: pageCount }, (_, i) => `${6 + i} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj`).join("\n");
  const text = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [${kids}] /Count ${pageCount} >> endobj
4 0 obj << /Length ${content.length} >> stream
${content}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
${pageObjects}
trailer << /Root 1 0 R /Size ${6 + pageCount} >>
%%EOF`;
  return new Uint8Array(Buffer.from(text));
}

test("extrae palabras con su posición, separando las que vienen en el mismo bloque de texto", async () => {
  const words = await extractPdfWords(syntheticPdf([{ x: 100, y: 700, text: "Saldo inicial $1,234.56" }, { x: 300, y: 650, text: "Fin" }]));
  assert.deepEqual(words.map((w) => w.text), ["Saldo", "inicial", "$1,234.56", "Fin"]);
  assert.ok(words[0].x0 === 100 && words[1].x0 > words[0].x1 && words[2].x0 > words[1].x1);
  assert.ok(words[3].top > words[0].top, "la línea de abajo (y menor en el PDF) queda con 'top' mayor");
  assert.deepEqual(new Set(words.map((w) => w.page)), new Set([1]));
});

test("numera las páginas desde 1", async () => {
  const words = await extractPdfWords(syntheticPdf([{ x: 10, y: 700, text: "Hola" }], 3));
  assert.deepEqual([...new Set(words.map((w) => w.page))].sort(), [1, 2, 3]);
});

test("un archivo que no es PDF da un error de formato claro", async () => {
  await assert.rejects(extractPdfWords(new Uint8Array(Buffer.from("esto no es un pdf"))), StatementFormatError);
});

test("un PDF con demasiadas páginas no parece un estado de cuenta y se rechaza", async () => {
  await assert.rejects(extractPdfWords(syntheticPdf([{ x: 10, y: 700, text: "x" }], MAX_PDF_PAGES + 1)), /más de \d+ páginas/);
});

test("el PDF se procesa solo en memoria: no se escribe ningún archivo ni queda nada nuevo en disco", async () => {
  const writes: string[] = [];
  const originals = {
    writeFile: fs.writeFile,
    writeFileSync: fs.writeFileSync,
    appendFile: fs.appendFile,
    appendFileSync: fs.appendFileSync,
    createWriteStream: fs.createWriteStream,
    promisesWriteFile: fs.promises.writeFile,
    promisesAppendFile: fs.promises.appendFile,
    mkdtemp: fs.mkdtemp,
    mkdtempSync: fs.mkdtempSync,
  };
  const spy = (name: string, original: (...args: never[]) => unknown) =>
    ((...args: unknown[]) => {
      writes.push(name);
      return (original as (...a: unknown[]) => unknown)(...args);
    }) as never;
  const listing = (dir: string) => new Set(fs.readdirSync(dir));
  const before = { tmp: listing(os.tmpdir()), cwd: listing(process.cwd()) };

  fs.writeFile = spy("writeFile", originals.writeFile);
  fs.writeFileSync = spy("writeFileSync", originals.writeFileSync);
  fs.appendFile = spy("appendFile", originals.appendFile);
  fs.appendFileSync = spy("appendFileSync", originals.appendFileSync);
  fs.createWriteStream = spy("createWriteStream", originals.createWriteStream);
  fs.promises.writeFile = spy("promises.writeFile", originals.promisesWriteFile);
  fs.promises.appendFile = spy("promises.appendFile", originals.promisesAppendFile);
  fs.mkdtemp = spy("mkdtemp", originals.mkdtemp);
  fs.mkdtempSync = spy("mkdtempSync", originals.mkdtempSync);
  try {
    const words = await extractPdfWords(syntheticPdf([{ x: 100, y: 700, text: "Detalle de movimientos" }]));
    assert.ok(words.length > 0);
  } finally {
    Object.assign(fs, { writeFile: originals.writeFile, writeFileSync: originals.writeFileSync, appendFile: originals.appendFile, appendFileSync: originals.appendFileSync, createWriteStream: originals.createWriteStream, mkdtemp: originals.mkdtemp, mkdtempSync: originals.mkdtempSync });
    fs.promises.writeFile = originals.promisesWriteFile;
    fs.promises.appendFile = originals.promisesAppendFile;
  }

  const added = (dir: string, was: Set<string>) => [...listing(dir)].filter((name) => !was.has(name));
  assert.deepEqual(writes, []);
  assert.deepEqual(added(os.tmpdir(), before.tmp).filter((name) => /pdf|statement|unpdf/i.test(name)), []);
  assert.deepEqual(added(process.cwd(), before.cwd), []);
});
