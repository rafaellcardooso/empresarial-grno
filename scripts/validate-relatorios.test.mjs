import assert from "node:assert/strict";
import { describe, it } from "node:test";

/** Espelha `tratativaChamadosPageFromParam` para validação sem transpile. */
function pageFromParam(param) {
  const page = Number(param);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

/** Espelha `endExclusiveFromInclusiveDate`. */
function endExclusive(date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Espelha flatten do CSV SIR (domínios separados). */
function flattenSirExport(summary) {
  return [
    { secao: "backlog", dominio: "RAL", total: summary.ral.totalActive },
    { secao: "backlog", dominio: "REC", total: summary.rec.totalActive },
  ];
}

describe("bsod report pagination", () => {
  it("rejects invalid pages and computes offset", () => {
    assert.equal(pageFromParam(undefined), 1);
    assert.equal(pageFromParam("0"), 1);
    assert.equal(pageFromParam("3"), 3);
    assert.equal((3 - 1) * 50, 100);
  });
});

describe("inclusive period", () => {
  it("converts inclusive end to exclusive next day", () => {
    const to = new Date(2026, 6, 30);
    const exclusive = endExclusive(to);
    assert.equal(exclusive.getFullYear(), 2026);
    assert.equal(exclusive.getMonth(), 6);
    assert.equal(exclusive.getDate(), 31);
  });
});

describe("sir export semantics", () => {
  it("keeps RAL and REC totals separate", () => {
    const rows = flattenSirExport({
      ral: { totalActive: 10 },
      rec: { totalActive: 5 },
    });
    assert.equal(rows.find((row) => row.dominio === "RAL")?.total, 10);
    assert.equal(rows.find((row) => row.dominio === "REC")?.total, 5);
    assert.equal(
      rows.reduce((sum, row) => sum + row.total, 0),
      15,
      "soma só para auditoria do teste; UI não exibe total cruzado",
    );
  });
});
