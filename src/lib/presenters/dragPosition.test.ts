import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPosition, movedBeyondThreshold, snapToSide } from "./dragPosition";

const viewport = { width: 390, height: 844 };
const bubble = { width: 48, height: 48 };

test("la burbuja se mantiene dentro de la pantalla con su margen", () => {
  assert.deepEqual(clampPosition({ x: -20, y: -5 }, viewport, bubble, 8), { x: 8, y: 8 });
  assert.deepEqual(clampPosition({ x: 500, y: 900 }, viewport, bubble, 8), { x: 334, y: 788 });
  assert.deepEqual(clampPosition({ x: 100, y: 200 }, viewport, bubble, 8), { x: 100, y: 200 });
});

test("un movimiento pequeño cuenta como toque y uno grande como arrastre", () => {
  assert.equal(movedBeyondThreshold({ x: 10, y: 10 }, { x: 12, y: 11 }), false);
  assert.equal(movedBeyondThreshold({ x: 10, y: 10 }, { x: 30, y: 10 }), true);
});

test("al soltarla la burbuja se pega al lateral más cercano y conserva su altura", () => {
  assert.deepEqual(snapToSide({ x: 60, y: 300 }, viewport, bubble, 8), { x: 8, y: 300 });
  assert.deepEqual(snapToSide({ x: 250, y: 300 }, viewport, bubble, 8), { x: 334, y: 300 });
  assert.deepEqual(snapToSide({ x: 100, y: 5000 }, viewport, bubble, 8), { x: 8, y: 788 });
});
