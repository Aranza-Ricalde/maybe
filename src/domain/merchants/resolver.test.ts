import assert from "node:assert/strict";
import { test } from "node:test";
import { isIdentifiableMerchant, learnNoiseTokens, merchantKey, resolveMerchant, sameMerchant } from "./resolver";

const NO_CONTEXT = { knownMerchants: [], noiseTokens: new Set<string>() };

test("merchantKey: variantes del mismo comercio comparten identidad (sin espacios, acentos ni mayúsculas)", () => {
  assert.equal(merchantKey("Va y Ven"), merchantKey("VAYVEN"));
  assert.equal(merchantKey("Nómina"), merchantKey("NOMINA"));
  assert.notEqual(merchantKey("Uber"), merchantKey("Didi"));
});

test("sameMerchant: misma identidad o uno contiene al otro; nombres muy cortos no se fusionan por contención", () => {
  assert.equal(sameMerchant("DiDi", "Didi Rides"), true);
  assert.equal(sameMerchant("Va y Ven", "Vayven"), true);
  assert.equal(sameMerchant("Nu", "Nubank"), false);
  assert.equal(sameMerchant("Uber", "Rappi"), false);
});

test("quita los prefijos del banco y se queda con el comercio, sin Gemini", () => {
  assert.equal(resolveMerchant("MERCADOPAGO ELCERDIT", NO_CONTEXT)?.name, "Elcerdit");
  assert.equal(resolveMerchant("CLIP MX TDA MODELORAMA", NO_CONTEXT)?.name, "Modelorama");
  assert.equal(resolveMerchant("STR CINEMEX COM", NO_CONTEXT)?.name, "Cinemex");
  assert.equal(resolveMerchant("D LOCAL DIDI RIDES", NO_CONTEXT)?.name, "Didi Rides");
});

test("los prefijos de procesadores de pago ('SP *', 'PAYPAL *') no son el comercio", () => {
  assert.equal(resolveMerchant("SP *UBER", NO_CONTEXT)?.name, "Uber");
  assert.equal(resolveMerchant("PAYPAL *SPOTIFY", NO_CONTEXT)?.name, "Spotify");
});

test("un comercio ya conocido fusiona sus variantes automáticamente", () => {
  const context = { knownMerchants: ["Va y Ven", "Oxxo", "Uber"], noiseTokens: new Set<string>() };
  assert.deepEqual(resolveMerchant("VAYVEN CAMI N", context), { name: "Va y Ven", matchedKnown: true });
  assert.deepEqual(resolveMerchant("VA Y VEN YUCATAN", context), { name: "Va y Ven", matchedKnown: true });
  assert.deepEqual(resolveMerchant("OXXOMANDALA MID CASH", context), { name: "Oxxo", matchedKnown: true });
  assert.deepEqual(resolveMerchant("UBR PENDING UBER COM", context), { name: "Uber", matchedKnown: true });
});

test("una palabra genérica conocida ('Restaurante', 'Cine', 'Agua') nunca absorbe a un comercio específico", () => {
  const context = { knownMerchants: ["Restaurante", "Cine", "Agua", "Edsaro", "Cinemex"], noiseTokens: new Set<string>() };
  assert.equal(resolveMerchant("REST EDSARO", context)?.name, "Edsaro");
  assert.equal(resolveMerchant("Cinemex Mérida", context)?.name, "Cinemex");
  assert.equal(resolveMerchant("SPEI ENVIADO MERCADO PAGO PAGO AGUA", context)?.name, "Mercado Pago");
  assert.equal(resolveMerchant("Pago de agua", { knownMerchants: ["Agua"], noiseTokens: new Set() })?.name, "Agua");
});

test("la coincidencia con un comercio conocido respeta fronteras de palabra: 'CAMI' no está en 'MONARCAMID'", () => {
  const context = { knownMerchants: ["Cami"], noiseTokens: new Set<string>() };
  assert.equal(resolveMerchant("OXXO MONARCA MID", context)?.matchedKnown, false);
});

test("las acentuaciones rotas del banco no cambian la identidad ('PUNTO Y GOMA' conserva su 'Y')", () => {
  assert.equal(resolveMerchant("PAPELERIA PUNTO Y GOMA", NO_CONTEXT)?.name, "Papeleria Punto Y Goma");
  assert.equal(resolveMerchant("Papelería Punto Y Goma", NO_CONTEXT)?.name, "Papeleria Punto Y Goma");
});

test("transferencias: el comercio es la institución, no la nota que escribió el usuario", () => {
  assert.equal(resolveMerchant("SPEI ENVIADO NU MEXICO PAGO TDC", NO_CONTEXT)?.name, "Nu México");
  assert.equal(resolveMerchant("SPEI ENVIADO MERCADO PAGO PAGO AGUA", NO_CONTEXT)?.name, "Mercado Pago");
  assert.equal(resolveMerchant("SPEI ENVIADO STP AHORRO", NO_CONTEXT)?.name, "STP");
});

test("transferencias: sin institución, es la persona antes de 'Transferencia' o el riel SPEI", () => {
  assert.equal(resolveMerchant("CARLOS MOGUEL TRANSFERENCIA", NO_CONTEXT)?.name, "Carlos Moguel");
  assert.equal(resolveMerchant("DEPOSITO SPEI RECIBIDO PAGOS QUINCENA", NO_CONTEXT)?.name, "SPEI");
});

test("learnNoiseTokens: aprende ciudades y sucursales de tu historial; nunca el nombre del propio comercio", () => {
  const history = [
    { description: "LIVERPOOL MERIDA", merchantName: "Liverpool" },
    { description: "SUSHI ROLL MERIDA COMPRA", merchantName: "Sushi Roll" },
    { description: "BODEGA AURRERA MERIDA", merchantName: "Bodega Aurrera" },
    { description: "CINEMEX GALS MERIDA", merchantName: "Cinemex" },
    { description: "VA Y VEN YUCATAN", merchantName: "Va y Ven" },
    { description: "VAYVEN CAMION", merchantName: "Va y Ven" },
    { description: "VA Y VEN TRANSPORTE", merchantName: "Va y Ven" },
  ];
  const noise = learnNoiseTokens(history);
  assert.equal(noise.has("MERIDA"), true);
  assert.equal(noise.has("VA"), false);
  assert.equal(noise.has("VEN"), false);
  assert.equal(noise.has("LIVERPOOL"), false);
});

test("el ruido aprendido se descarta al nombrar un comercio nuevo", () => {
  const context = { knownMerchants: [], noiseTokens: new Set(["MERIDA", "AMERICAS"]) };
  assert.equal(resolveMerchant("REST SENSEI MERIDA AMERICAS", context)?.name, "Sensei");
});

test("una descripción vacía o solo de prefijos no se inventa: devuelve null", () => {
  assert.equal(resolveMerchant("", NO_CONTEXT), null);
  assert.equal(resolveMerchant("1234 5678", NO_CONTEXT), null);
});

test("isIdentifiableMerchant: solo un comercio real puede darle identidad a un concepto", () => {
  assert.equal(isIdentifiableMerchant("Telmex"), true);
  assert.equal(isIdentifiableMerchant("Va y Ven"), true);
  assert.equal(isIdentifiableMerchant("Sin identificar"), false);
  assert.equal(isIdentifiableMerchant("SPEI"), false);
  assert.equal(isIdentifiableMerchant("Restaurante"), false);
  assert.equal(isIdentifiableMerchant(""), false);
});
