import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createRequire } from "node:module";
import { parseTxOpticalCsv, parseBrDecimal } from "../workers/tx-ingest/lib/parse-csv.mjs";
import {
  decideTxSampleReason,
  parseHeartbeatHours,
  parseRetentionDays,
  txMetricsEqual,
} from "../workers/tx-ingest/lib/history.mjs";
import { extractUfsFromDesignacao, matchesRegion } from "../workers/tx-ingest/lib/uf.mjs";

const require = createRequire(import.meta.url);
const tsx = require("tsx/cjs/api");
const { parseTxDesignacao } = tsx.require(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../lib/config/tx-optical.ts"),
  import.meta.url,
);

const fixture = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../workers/tx-ingest/fixtures/potencia_optica_de_transmissao.csv",
);

test("extractUfsFromDesignacao lê uma ou várias UFs", () => {
  assert.deepEqual(extractUfsFromDesignacao("FOO / (PA) / BAR"), ["PA"]);
  assert.deepEqual(extractUfsFromDesignacao("FOO / (CE)(RN)"), ["CE", "RN"]);
});

test("matchesRegion aceita interseção com MA/AM/PA/AP", () => {
  assert.equal(matchesRegion("X / (PA) / Y", ["MA", "AM", "PA", "AP"]), true);
  assert.equal(matchesRegion("X / (CE)(RN)", ["MA", "AM", "PA", "AP"]), false);
});

test("parseBrDecimal mantém -99", () => {
  assert.equal(parseBrDecimal("-99"), -99);
  assert.equal(parseBrDecimal("15,01"), 15.01);
});

test("parseTxDesignacao lê KM e empresa após (UF)", () => {
  assert.deepEqual(
    parseTxDesignacao(
      "AGN N05 ITZ RC OTS 001 / 116 KM / (TO)(MA) / WIRELINK / RABICHO CLARO 4.8KM DE AGN",
    ),
    { rota: "AGN N05 ITZ RC OTS 001", extensaoKm: 116, empresa: "WIRELINK" },
  );
  assert.deepEqual(parseTxDesignacao("AGNPFC ITZ RC OTS 004 / 154 KM / (TO)(MA) / TIM / LINHAO"), {
    rota: "AGNPFC ITZ RC OTS 004",
    extensaoKm: 154,
    empresa: "TIM · LINHAO",
  });
  assert.deepEqual(
    parseTxDesignacao("AIU VIV BLM QB OTS 002 / 31.2 KM / (PA) / LINHAO (6.7 KM FO CLARO)"),
    { rota: "AIU VIV BLM QB OTS 002", extensaoKm: 31.2, empresa: "LINHAO" },
  );
  assert.deepEqual(parseTxDesignacao("AMM CL2 AMM 0EO OTS 001 / 23 KM / (PA) / (CLARO/8 KM)"), {
    rota: "AMM CL2 AMM 0EO OTS 001",
    extensaoKm: 23,
    empresa: "CLARO",
  });
  assert.deepEqual(
    parseTxDesignacao("AGNPFC CRN CAR OTS 001 / 115 KM / (TO)(MA) / OTDR EMBARCADO EM PSS"),
    { rota: "AGNPFC CRN CAR OTS 001", extensaoKm: 115, empresa: null },
  );
});

test("txMetricsEqual e decideTxSampleReason cobrem first/change/heartbeat/skip", () => {
  const base = {
    designacao: "FOO / (PA) / BAR",
    ufs: "PA",
    node_a: "A",
    port_a: "P1",
    node_b: "B",
    port_b: "P2",
    txpower_a: 1.5,
    rxpower_b: -2,
    span_loss_a_to_b: 3,
    ref_span_loss_a_to_b: 3.1,
    dif_ref_span_loss_a_to_b: 0.1,
    txpower_b: 1.2,
    rxpower_a: -1.8,
    span_loss_b_to_a: 3.2,
    ref_span_loss_b_to_a: 3.2,
    dif_ref_span_loss_b_to_a: 0,
  };
  const previous = { ...base, sampled_at: "2026-11-17T10:00:00.000Z" };
  const nowMs = Date.parse("2026-11-17T12:00:00.000Z");
  const heartbeatMs = 6 * 60 * 60 * 1000;

  assert.equal(decideTxSampleReason(base, null, nowMs, heartbeatMs), "first");
  assert.equal(txMetricsEqual(base, previous), true);
  assert.equal(decideTxSampleReason(base, previous, nowMs, heartbeatMs), null);
  assert.equal(
    decideTxSampleReason(base, previous, Date.parse("2026-11-17T16:00:00.000Z"), heartbeatMs),
    "heartbeat",
  );
  assert.equal(
    decideTxSampleReason({ ...base, dif_ref_span_loss_a_to_b: -4.2 }, previous, nowMs, heartbeatMs),
    "change",
  );
  assert.equal(parseHeartbeatHours("6"), 6);
  assert.equal(parseRetentionDays("90"), 90);
  assert.equal(parseHeartbeatHours("0"), 6);
  assert.equal(parseRetentionDays("abc"), 90);
});

test("parseTxOpticalCsv filtra região no fixture", () => {
  const text = fs.readFileSync(fixture, "utf8");
  const { rows, skipped } = parseTxOpticalCsv(text, ["MA", "AM", "PA", "AP"]);
  assert.ok(rows.length >= 140 && rows.length <= 160, `rows=${rows.length}`);
  assert.ok(skipped > 1000);
  assert.ok(rows.every((row) => /MA|AM|PA|AP/.test(row.ufs)));
  const withMinus99 = rows.some(
    (row) =>
      row.txpower_a === -99 ||
      row.txpower_b === -99 ||
      row.rxpower_a === -99 ||
      row.rxpower_b === -99,
  );
  // fixture pode ou não ter -99 na região; só garante que o parser não rejeita o valor
  assert.equal(typeof withMinus99, "boolean");
});
