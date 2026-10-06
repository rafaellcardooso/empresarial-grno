import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { maskDocument, parseTecnicoSkill, type TecnicoSkill } from "@/lib/config/tecnicos";
import { getSirPool, sirQuery } from "@/lib/db/sir";
import type {
  Tecnico,
  TecnicoFilters,
  TecnicoImportResult,
  TecnicoInput,
  TecnicoListItem,
} from "@/lib/models/tecnico";

type TecnicoRow = RowDataPacket & {
  id: number;
  nome: string;
  login: string;
  ddd: string;
  cidade: string;
  un: string | null;
  telefone: string | null;
  rg: string | null;
  cpf: string | null;
  ativo: number;
  skills: string | null;
  updated_at: Date | string | null;
};

const SELECT_TECNICO = `SELECT t.id, t.nome, t.login, t.ddd, t.cidade, t.un, t.telefone, t.rg, t.cpf,
    t.ativo, t.updated_at,
    (SELECT GROUP_CONCAT(s.skill ORDER BY s.skill SEPARATOR ',')
       FROM app_tecnico_skills s WHERE s.tecnico_id = t.id) AS skills
  FROM app_tecnicos t`;

/** Converte linha do banco em técnico completo. */
function toTecnico(row: TecnicoRow): Tecnico {
  return {
    id: row.id,
    nome: row.nome,
    login: row.login,
    ddd: row.ddd,
    cidade: row.cidade,
    un: row.un,
    telefone: row.telefone,
    rg: row.rg,
    cpf: row.cpf,
    ativo: row.ativo === 1,
    skills: (row.skills ?? "")
      .split(",")
      .map((code) => parseTecnicoSkill(code))
      .filter((code): code is TecnicoSkill => Boolean(code)),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

/** Converte técnico completo em item de listagem com RG/CPF mascarados. */
function toListItem(tecnico: Tecnico): TecnicoListItem {
  const { rg, cpf, ...rest } = tecnico;
  return { ...rest, rgMasked: maskDocument(rg), cpfMasked: maskDocument(cpf) };
}

/** Monta WHERE dos filtros; `omit` remove um filtro para a base das contagens dos chips. */
function buildWhere(
  filters: TecnicoFilters,
  omit?: "ddd" | "skill",
): { sql: string; params: string[] } {
  const clauses: string[] = [];
  const params: string[] = [];
  if (filters.ativo !== undefined) {
    clauses.push("t.ativo = ?");
    params.push(filters.ativo ? "1" : "0");
  }
  if (filters.ddd && omit !== "ddd") {
    clauses.push("t.ddd = ?");
    params.push(filters.ddd);
  }
  if (filters.skill && omit !== "skill") {
    clauses.push(
      "EXISTS (SELECT 1 FROM app_tecnico_skills s WHERE s.tecnico_id = t.id AND s.skill = ?)",
    );
    params.push(filters.skill);
  }
  if (filters.q) {
    const like = `%${filters.q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    clauses.push("(t.nome LIKE ? OR t.login LIKE ? OR t.cidade LIKE ?)");
    params.push(like, like, like);
  }
  return { sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
}

/** Lista técnicos paginados (ordem: DDD, nome) com o total para os mesmos filtros. */
export async function listTecnicos(
  filters: TecnicoFilters,
  page: number,
  limit: number,
): Promise<{ items: TecnicoListItem[]; total: number }> {
  const where = buildWhere(filters);
  const [rows, countRows] = await Promise.all([
    sirQuery<TecnicoRow[]>(
      `${SELECT_TECNICO}${where.sql} ORDER BY t.ddd, t.nome, t.id LIMIT ? OFFSET ?`,
      [...where.params, limit, (page - 1) * limit],
    ),
    sirQuery<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM app_tecnicos t${where.sql}`,
      where.params,
    ),
  ]);
  return { items: rows.map(toTecnico).map(toListItem), total: Number(countRows[0]?.total ?? 0) };
}

/** Conta técnicos por DDD com os demais filtros aplicados (chips de DDD). */
export async function countTecnicosByDdd(filters: TecnicoFilters): Promise<Record<string, number>> {
  const where = buildWhere(filters, "ddd");
  const rows = await sirQuery<(RowDataPacket & { ddd: string; total: number })[]>(
    `SELECT t.ddd, COUNT(*) AS total FROM app_tecnicos t${where.sql} GROUP BY t.ddd`,
    where.params,
  );
  return Object.fromEntries(rows.map((row) => [row.ddd, Number(row.total)]));
}

/** Conta técnicos por skill com os demais filtros aplicados (chips de skill) e o total sem skill. */
export async function countTecnicosBySkill(
  filters: TecnicoFilters,
): Promise<{ bySkill: Record<string, number>; total: number }> {
  const where = buildWhere(filters, "skill");
  const [rows, totalRows] = await Promise.all([
    sirQuery<(RowDataPacket & { skill: string; total: number })[]>(
      `SELECT s.skill, COUNT(*) AS total
         FROM app_tecnicos t JOIN app_tecnico_skills s ON s.tecnico_id = t.id${where.sql}
        GROUP BY s.skill`,
      where.params,
    ),
    sirQuery<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM app_tecnicos t${where.sql}`,
      where.params,
    ),
  ]);
  return {
    bySkill: Object.fromEntries(rows.map((row) => [row.skill, Number(row.total)])),
    total: Number(totalRows[0]?.total ?? 0),
  };
}

/** Busca técnico pelo id com RG/CPF completos. */
export async function getTecnicoById(id: number): Promise<Tecnico | null> {
  const rows = await sirQuery<TecnicoRow[]>(`${SELECT_TECNICO} WHERE t.id = ? LIMIT 1`, [id]);
  return rows[0] ? toTecnico(rows[0]) : null;
}

/** Indica se o login já pertence a outro técnico. */
export async function isTecnicoLoginTaken(login: string, exceptId?: number): Promise<boolean> {
  const rows = await sirQuery<(RowDataPacket & { id: number })[]>(
    "SELECT id FROM app_tecnicos WHERE login = ? AND id <> ? LIMIT 1",
    [login, exceptId ?? 0],
  );
  return rows.length > 0;
}

/** Substitui as skills do técnico dentro da transação. */
async function replaceSkills(
  connection: PoolConnection,
  tecnicoId: number,
  skills: TecnicoSkill[],
) {
  await connection.execute("DELETE FROM app_tecnico_skills WHERE tecnico_id = ?", [tecnicoId]);
  if (skills.length === 0) return;
  await connection.query("INSERT INTO app_tecnico_skills (tecnico_id, skill) VALUES ?", [
    skills.map((skill) => [tecnicoId, skill]),
  ]);
}

/** Valores de coluna na ordem de INSERT/UPDATE. */
function columnValues(input: TecnicoInput, userId: number) {
  return [
    input.nome,
    input.login,
    input.ddd,
    input.cidade,
    input.un,
    input.telefone,
    input.rg,
    input.cpf,
    input.ativo ? 1 : 0,
    userId,
  ];
}

/** Executa `work` em transação no pool SIR (rollback em erro). */
async function withTransaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getSirPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

const OPTIONAL_UPSERT_COLUMNS = ["un", "telefone", "rg", "cpf", "ativo"] as const;

/**
 * Inclui técnico ou atualiza pelo login (upsert); retorna id e se foi inclusão.
 * Em atualização, colunas opcionais fora de `columns` e as skills (quando `skills` ausente)
 * mantêm o valor gravado.
 */
async function upsertTecnico(
  connection: PoolConnection,
  input: TecnicoInput,
  userId: number,
  columns?: ReadonlySet<string>,
): Promise<{ id: number; inserted: boolean }> {
  const updated = ["nome", "ddd", "cidade", "updated_by"].concat(
    OPTIONAL_UPSERT_COLUMNS.filter((column) => !columns || columns.has(column)),
  );
  const [result] = await connection.query<ResultSetHeader>(
    `INSERT INTO app_tecnicos (nome, login, ddd, cidade, un, telefone, rg, cpf, ativo, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id),
       ${updated.map((column) => `${column} = VALUES(${column})`).join(", ")}`,
    columnValues(input, userId),
  );
  const inserted = result.affectedRows === 1;
  if (inserted || !columns || columns.has("skills")) {
    await replaceSkills(connection, result.insertId, input.skills);
  }
  return { id: result.insertId, inserted };
}

/** Cadastra técnico novo (login ainda não usado). */
export async function createTecnico(input: TecnicoInput, userId: number): Promise<number> {
  return withTransaction(async (connection) => (await upsertTecnico(connection, input, userId)).id);
}

/** Atualiza técnico existente pelo id e substitui as skills. */
export async function updateTecnico(
  id: number,
  input: TecnicoInput,
  userId: number,
): Promise<void> {
  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE app_tecnicos SET nome = ?, login = ?, ddd = ?, cidade = ?, un = ?, telefone = ?,
         rg = ?, cpf = ?, ativo = ?, updated_by = ? WHERE id = ?`,
      [...columnValues(input, userId), id],
    );
    await replaceSkills(connection, id, input.skills);
  });
}

/**
 * Grava importação CSV em transação única (tudo ou nada): upsert por login.
 * Colunas ausentes do arquivo preservam os dados já cadastrados.
 */
export async function importTecnicos(
  rows: TecnicoInput[],
  columns: readonly string[],
  userId: number,
): Promise<TecnicoImportResult> {
  const columnSet = new Set(columns);
  return withTransaction(async (connection) => {
    let inserted = 0;
    for (const row of rows) {
      if ((await upsertTecnico(connection, row, userId, columnSet)).inserted) inserted += 1;
    }
    return { inserted, updated: rows.length - inserted };
  });
}
