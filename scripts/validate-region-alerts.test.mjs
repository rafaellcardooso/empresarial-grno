import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Espelha `parseUserRegionUf`. */
function parseUserRegionUf(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return ["MA", "AM", "PA", "AP"].includes(normalized) ? normalized : null;
}

/** Espelha `sortUserRegionUfs` + `serializeAlertUfs`. */
function serializeAlertUfs(ufs) {
  const order = ["MA", "AM", "PA", "AP"];
  const set = new Set(ufs);
  return order.filter((uf) => set.has(uf)).join(",");
}

/** Espelha `parseAlertUfs`. */
function parseAlertUfs(raw) {
  if (!raw || !String(raw).trim()) return [];
  const parsed = [];
  for (const part of String(raw).split(",")) {
    const uf = parseUserRegionUf(part);
    if (uf && !parsed.includes(uf)) parsed.push(uf);
  }
  return serializeAlertUfs(parsed).split(",").filter(Boolean);
}

/** Espelha `parseAlertUfsInput`. */
function parseAlertUfsInput(value) {
  if (value === "all" || value === "ALL") return ["MA", "AM", "PA", "AP"];
  if (!Array.isArray(value)) return null;
  const parsed = [];
  for (const item of value) {
    const uf = parseUserRegionUf(item);
    if (!uf) return null;
    if (!parsed.includes(uf)) parsed.push(uf);
  }
  return parsed.length > 0 ? parseAlertUfs(serializeAlertUfs(parsed)) : null;
}

/** Espelha `needsRegionSetup`. */
function needsRegionSetup(homeUf, alertUfs) {
  return !homeUf || alertUfs.length === 0;
}

/** Código geográfico do 2º segmento do CF (espelha sir-locations). */
function sirLocationCodeFromCf(cf) {
  if (!cf) return undefined;
  return cf.split("/")[1]?.trim().toUpperCase() || undefined;
}

const CODE_UF = {
  SLS: "MA",
  BLA: "MA",
  MNS: "AM",
  BVA: "AM",
  BLM: "PA",
  ATM: "PA",
  MPA: "AP",
};

/** Filtra chamados pelas UFs de alerta. */
function filterByAlertUfs(records, alertUfs) {
  const wanted = new Set(alertUfs);
  return records.filter((row) => {
    const code = sirLocationCodeFromCf(row.cf);
    const uf = code ? CODE_UF[code] : undefined;
    return uf ? wanted.has(uf) : false;
  });
}

describe("user region parsing", () => {
  it("accepts MA/AM/PA/AP and rejects others", () => {
    assert.equal(parseUserRegionUf("ma"), "MA");
    assert.equal(parseUserRegionUf(" PA "), "PA");
    assert.equal(parseUserRegionUf("ap"), "AP");
    assert.equal(parseUserRegionUf("SP"), null);
    assert.equal(parseUserRegionUf(""), null);
  });

  it("serializes alert_ufs in canonical order", () => {
    assert.equal(serializeAlertUfs(["PA", "AP", "MA", "AM"]), "MA,AM,PA,AP");
    assert.equal(serializeAlertUfs(["AM"]), "AM");
    assert.deepEqual(parseAlertUfs("PA,MA,AP"), ["MA", "PA", "AP"]);
    assert.deepEqual(parseAlertUfs(""), []);
  });

  it("parses alert input including all shortcut", () => {
    assert.deepEqual(parseAlertUfsInput("all"), ["MA", "AM", "PA", "AP"]);
    assert.deepEqual(parseAlertUfsInput(["am", "PA"]), ["AM", "PA"]);
    assert.equal(parseAlertUfsInput(["AM", "XX"]), null);
    assert.equal(parseAlertUfsInput([]), null);
  });

  it("flags incomplete region setup", () => {
    assert.equal(needsRegionSetup(null, []), true);
    assert.equal(needsRegionSetup("MA", []), true);
    assert.equal(needsRegionSetup(null, ["MA"]), true);
    assert.equal(needsRegionSetup("MA", ["MA"]), false);
  });
});

describe("shell alert UF filter", () => {
  const sample = [
    { num: "A", cf: "CF/SLS/NET/FO" },
    { num: "B", cf: "CF/MNS/NET/FO" },
    { num: "C", cf: "CF/BLM/NET/FO" },
    { num: "E", cf: "CF/MPA/NET/FO" },
    { num: "D", cf: "CF LAB /NET/FO" },
  ];

  it("keeps only selected UFs and drops unknown CF codes", () => {
    assert.deepEqual(
      filterByAlertUfs(sample, ["MA"]).map((row) => row.num),
      ["A"],
    );
    assert.deepEqual(
      filterByAlertUfs(sample, ["AM", "PA", "AP"]).map((row) => row.num),
      ["B", "C", "E"],
    );
    assert.deepEqual(filterByAlertUfs(sample, []), []);
  });
});
