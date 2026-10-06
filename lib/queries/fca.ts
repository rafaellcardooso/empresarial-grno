import type { RowDataPacket } from "mysql2/promise";
import { FCA_SEARCH_LIMIT } from "@/lib/config/fca";
import { sirQuery } from "@/lib/db/sir";
import { extractDetailAddress, extractDetailField } from "@/lib/fca/parse-details";
import type { FcaRecord, FcaSearchResponse } from "@/lib/models/fca";
import { SIR_TABLES } from "@/lib/models/sir";

type RalSearchRow = RowDataPacket & {
  num_recup: string;
  status: string;
  tipo_ral: string | null;
  descricao: string | null;
  cf_executante: string | null;
  abertura: string | null;
  detalhes: string | null;
  ultima_atualizacao: Date | string | null;
};

type RecSearchRow = RowDataPacket & {
  num_recup: string;
  status: string;
  cliente: string | null;
  designacao: string | null;
  cf_executante: string | null;
  abertura: string | null;
  detalhes_title: string | null;
  ultima_atualizacao: Date | string | null;
};

type SearchPlan = {
  ral: { sql: string; params: string[] } | null;
  rec: { sql: string; params: string[] } | null;
};

const NUMBER_WITH_PREFIX = /^(RAL|REC|DSR|TCQ)-?(\d+)(?:\/(\d{4}))?$/;
const NUMBER_ONLY = /^(\d+)(?:\/(\d{4}))?$/;

/** Escapa curingas do LIKE no termo digitado. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Define filtros por tabela: número com prefixo busca só a tabela do prefixo;
 * só dígitos busca número e designação nas duas; demais termos buscam designação.
 */
function buildSearchPlan(term: string): SearchPlan {
  const compact = term.toUpperCase().replace(/\s+/g, "");
  const prefixed = compact.match(NUMBER_WITH_PREFIX);
  if (prefixed) {
    const [, prefix, digits, year] = prefixed;
    const like = `${prefix}-${digits}${year ? `/${year}` : ""}%`;
    const clause = { sql: "num_recup LIKE ?", params: [like] };
    return prefix === "RAL" ? { ral: clause, rec: null } : { ral: null, rec: clause };
  }

  const numeric = compact.match(NUMBER_ONLY);
  const designacaoLike = `%${escapeLike(term.trim())}%`;
  if (numeric) {
    const numberLike = `%-${numeric[1]}${numeric[2] ? `/${numeric[2]}` : ""}%`;
    return {
      ral: { sql: "(num_recup LIKE ? OR descricao LIKE ?)", params: [numberLike, designacaoLike] },
      rec: { sql: "(num_recup LIKE ? OR designacao LIKE ?)", params: [numberLike, designacaoLike] },
    };
  }

  return {
    ral: { sql: "descricao LIKE ?", params: [designacaoLike] },
    rec: { sql: "designacao LIKE ?", params: [designacaoLike] },
  };
}

/** Converte linha de `rals` em chamado do FCA (designação = descrição quando ausente nos detalhes). */
function ralToFcaRecord(row: RalSearchRow): FcaRecord {
  return {
    kind: "RAL",
    numRecup: row.num_recup,
    status: row.status,
    tipo: row.tipo_ral,
    cliente: extractDetailField(row.detalhes, ["Razão Social", "Razao Social"]),
    designacao:
      extractDetailField(row.detalhes, ["Designação", "Designacao"]) ??
      row.descricao?.trim() ??
      null,
    endereco: extractDetailAddress(row.detalhes),
    contato: extractDetailField(row.detalhes, ["Reclamante"]),
    cfExecutante: row.cf_executante,
    abertura: row.abertura,
  };
}

/** Converte linha de `recs` em chamado do FCA (nome completo dos detalhes, senão coluna cliente). */
function recToFcaRecord(row: RecSearchRow): FcaRecord {
  return {
    kind: "REC",
    numRecup: row.num_recup,
    status: row.status,
    tipo: row.num_recup.split("-")[0] ?? null,
    cliente:
      extractDetailField(row.detalhes_title, ["NOME", "Razão Social", "Razao Social"]) ??
      row.cliente?.trim() ??
      null,
    designacao: row.designacao?.trim() || null,
    endereco: extractDetailAddress(row.detalhes_title),
    contato: extractDetailField(row.detalhes_title, ["NOME E CONTATO DO CLIENTE", "Reclamante"]),
    cfExecutante: row.cf_executante,
    abertura: row.abertura,
  };
}

/** Ordem do seletor: ativos primeiro, depois atualização mais recente. */
function compareSearchRows(
  a: { status: string; updatedAt: number },
  b: { status: string; updatedAt: number },
): number {
  const activeDiff = Number(b.status === "ATIVO") - Number(a.status === "ATIVO");
  return activeDiff || b.updatedAt - a.updatedAt;
}

/**
 * Busca chamados RAL/REC por número ou designação para montar o FCA.
 * Sem paginação: seletor limitado a FCA_SEARCH_LIMIT itens, com `hasMore` para o usuário refinar o termo.
 */
export async function searchFcaRecords(term: string): Promise<FcaSearchResponse> {
  const plan = buildSearchPlan(term);
  const fetchLimit = FCA_SEARCH_LIMIT + 1;
  const order = "ORDER BY status = 'ATIVO' DESC, ultima_atualizacao DESC LIMIT ?";

  const [rals, recs] = await Promise.all([
    plan.ral
      ? sirQuery<RalSearchRow[]>(
          `SELECT num_recup, status, tipo_ral, descricao, cf_executante, abertura, detalhes, ultima_atualizacao
             FROM ${SIR_TABLES.rals} WHERE ${plan.ral.sql} ${order}`,
          [...plan.ral.params, fetchLimit],
        )
      : Promise.resolve([] as RalSearchRow[]),
    plan.rec
      ? sirQuery<RecSearchRow[]>(
          `SELECT num_recup, status, cliente, designacao, cf_executante, abertura, detalhes_title, ultima_atualizacao
             FROM ${SIR_TABLES.recs} WHERE ${plan.rec.sql} ${order}`,
          [...plan.rec.params, fetchLimit],
        )
      : Promise.resolve([] as RecSearchRow[]),
  ]);

  const merged = [
    ...rals.map((row) => ({ row, record: ralToFcaRecord(row) })),
    ...recs.map((row) => ({ row, record: recToFcaRecord(row) })),
  ]
    .map(({ row, record }) => ({
      record,
      status: record.status,
      updatedAt: row.ultima_atualizacao ? new Date(row.ultima_atualizacao).getTime() : 0,
    }))
    .sort(compareSearchRows);

  return {
    items: merged.slice(0, FCA_SEARCH_LIMIT).map((item) => item.record),
    hasMore: merged.length > FCA_SEARCH_LIMIT,
  };
}
