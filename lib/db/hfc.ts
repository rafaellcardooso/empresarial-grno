import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

declare global {
  var __hfcPool: Pool | undefined;
}

/** Lê variável de ambiente obrigatória ou lança erro. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

/** Retorna pool MySQL somente leitura do hfc-sls (singleton em global). */
export function getHfcPool(): Pool {
  if (!global.__hfcPool) {
    global.__hfcPool = mysql.createPool({
      host: required("HFC_DB_HOST"),
      user: required("HFC_DB_USER"),
      password: required("HFC_DB_PASSWORD"),
      database: process.env.HFC_DB_NAME || "hfc-sls",
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return global.__hfcPool;
}

/** Executa query parametrizada no pool hfc-sls e retorna as linhas. */
export async function hfcQuery<T extends RowDataPacket[]>(
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  const [rows] = await getHfcPool().query<T>(sql, params);
  return rows;
}
