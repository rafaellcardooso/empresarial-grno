import type { RowDataPacket } from "mysql2";
import { parseTxDesignacao, TX_REGION_UFS } from "@/lib/config/tx-optical";
import type { UserRegionUf } from "@/lib/config/user-regions";
import { sirQuery } from "@/lib/db/sir";
import {
  TX_DIF_REF_LEGEND,
  TX_DIF_REF_TONES,
  worstDifRefTone,
  type TxDifRefTone,
} from "@/lib/format/tx-optical";
import type { TxReportRankItem, TxReportSummary } from "@/lib/models/tx-report";

type ReportRow = RowDataPacket & {
  designacao: string;
  ufs: string;
  dif_ref_span_loss_a_to_b: number | string | null;
  dif_ref_span_loss_b_to_a: number | string | null;
  last_seen_at: Date | string | null;
};

/** Conta spans ativos cuja coluna `ufs` contém a UF. */
function ufMatchClause(ufs: readonly string[]): { sql: string; params: string[] } {
  if (ufs.length === 0) return { sql: "0", params: [] };
  const parts = ufs.map(() => "FIND_IN_SET(?, ufs) > 0");
  return { sql: `(${parts.join(" OR ")})`, params: [...ufs] };
}

/** Incrementa contagem em mapa string→número. */
function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/** Ordena ranking por contagem decrescente e rótulo estável. */
function toRank(map: Map<string, number>): TxReportRankItem[] {
  return [...map.entries()]
    .map(([id, count]) => ({ id, label: id, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
}

/** Monta o resumo analítico TX dos enlaces ativos na região. */
export async function getTxReportSummary(
  regionUfs: readonly UserRegionUf[] = TX_REGION_UFS,
): Promise<TxReportSummary> {
  if (regionUfs.length === 0) {
    return {
      activeCount: 0,
      lastSeenAt: null,
      byUf: [],
      byEmpresa: [],
      byDifTone: TX_DIF_REF_TONES.map((tone) => ({
        id: tone,
        label: TX_DIF_REF_LEGEND.find((item) => item.tone === tone)?.label ?? tone,
        count: 0,
        tone,
      })),
    };
  }

  const { sql: matchSql, params } = ufMatchClause(regionUfs);
  const rows = await sirQuery<ReportRow[]>(
    `SELECT designacao, ufs, dif_ref_span_loss_a_to_b, dif_ref_span_loss_b_to_a, last_seen_at
     FROM tx_optical_spans
     WHERE is_active = 1 AND ${matchSql}`,
    params,
  );

  const byUf = new Map<string, number>();
  const byEmpresa = new Map<string, number>();
  const byTone = new Map<TxDifRefTone, number>(TX_DIF_REF_TONES.map((tone) => [tone, 0]));
  let lastSeenAt: string | null = null;

  for (const row of rows) {
    for (const uf of String(row.ufs ?? "")
      .split(",")
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean)) {
      if (regionUfs.includes(uf as UserRegionUf)) bump(byUf, uf);
    }

    const parts = parseTxDesignacao(row.designacao);
    bump(byEmpresa, parts.empresa?.trim() || "Não informada");

    const tone = worstDifRefTone(row.dif_ref_span_loss_a_to_b, row.dif_ref_span_loss_b_to_a);
    byTone.set(tone, (byTone.get(tone) ?? 0) + 1);

    const raw = row.last_seen_at;
    const iso = raw == null ? null : typeof raw === "string" ? raw : raw.toISOString();
    if (iso && (!lastSeenAt || iso > lastSeenAt)) lastSeenAt = iso;
  }

  return {
    activeCount: rows.length,
    lastSeenAt,
    byUf: toRank(byUf),
    byEmpresa: toRank(byEmpresa),
    byDifTone: TX_DIF_REF_TONES.map((tone) => ({
      id: tone,
      label: TX_DIF_REF_LEGEND.find((item) => item.tone === tone)?.label ?? tone,
      count: byTone.get(tone) ?? 0,
      tone,
    })),
  };
}
