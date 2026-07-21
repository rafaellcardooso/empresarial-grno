import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

declare global {
  var __sirPool: Pool | undefined;
}

/** Lê variável de ambiente obrigatória ou lança erro. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

/** Monta configuração do pool MySQL SIR a partir de SIR_DB_*. */
function getSirPoolConfig() {
  return {
    host: required("SIR_DB_HOST"),
    port: Number(process.env.SIR_DB_PORT || 3306),
    user: required("SIR_DB_USER"),
    password: required("SIR_DB_PASSWORD"),
    database: process.env.SIR_DB_NAME || "claroEmpresarial",
    waitForConnections: true,
    connectionLimit: 5,
  };
}

/** Retorna pool MySQL do banco SIR (singleton em global). */
export function getSirPool(): Pool {
  if (!global.__sirPool) {
    global.__sirPool = mysql.createPool(getSirPoolConfig());
  }
  return global.__sirPool;
}

/** Executa query parametrizada no pool SIR e retorna as linhas. */
export async function sirQuery<T extends RowDataPacket[]>(
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  const [rows] = await getSirPool().query<T>(sql, params);
  return rows;
}
