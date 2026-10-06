import { TECNICO_CSV_COLUMNS, TECNICO_IMPORT_MAX_ROWS } from "@/lib/config/tecnicos";
import type { TecnicoImportError, TecnicoInput } from "@/lib/models/tecnico";
import { validateTecnicoInput } from "@/lib/tecnicos/validate";

/** Separa uma linha CSV respeitando aspas duplas (`""` dentro de aspas = aspa literal). */
function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (inQuotes) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

/** Normaliza nome de coluna do cabeçalho (minúsculas, sem acento). */
function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Converte CSV de técnicos em entradas validadas; separador `;` ou `,` detectado no cabeçalho.
 * Retorna colunas presentes, erros por linha (numeração do arquivo) e logins duplicados no arquivo.
 */
export function parseTecnicosCsv(content: string): {
  rows: TecnicoInput[];
  columns: string[];
  errors: TecnicoImportError[];
} {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headerLine = lines[0] ?? "";
  const delimiter = headerLine.split(";").length >= headerLine.split(",").length ? ";" : ",";
  const headers = splitCsvLine(headerLine, delimiter).map(normalizeHeader);

  const missing = ["nome", "login", "ddd", "cidade"].filter((column) => !headers.includes(column));
  if (missing.length) {
    return {
      rows: [],
      columns: headers,
      errors: [{ line: 1, message: `Colunas obrigatórias ausentes: ${missing.join(", ")}.` }],
    };
  }
  const unknown = headers.filter(
    (column) => column && !(TECNICO_CSV_COLUMNS as readonly string[]).includes(column),
  );
  if (unknown.length) {
    return {
      rows: [],
      columns: headers,
      errors: [{ line: 1, message: `Colunas desconhecidas: ${unknown.join(", ")}.` }],
    };
  }

  const rows: TecnicoInput[] = [];
  const errors: TecnicoImportError[] = [];
  const seenLogins = new Map<string, number>();

  lines.slice(1).forEach((line, index) => {
    const lineNumber = index + 2;
    if (!line.trim()) return;
    const cells = splitCsvLine(line, delimiter);
    const raw = Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ""]));
    const result = validateTecnicoInput(raw);
    if (!result.ok) {
      errors.push({ line: lineNumber, message: result.error });
      return;
    }
    const firstLine = seenLogins.get(result.value.login);
    if (firstLine) {
      errors.push({
        line: lineNumber,
        message: `Login ${result.value.login} repetido (linha ${firstLine}).`,
      });
      return;
    }
    seenLogins.set(result.value.login, lineNumber);
    rows.push(result.value);
  });

  if (rows.length + errors.length > TECNICO_IMPORT_MAX_ROWS) {
    return {
      rows: [],
      columns: headers,
      errors: [{ line: 1, message: `Máximo de ${TECNICO_IMPORT_MAX_ROWS} linhas por importação.` }],
    };
  }
  if (rows.length === 0 && errors.length === 0) {
    errors.push({ line: 2, message: "Arquivo sem linhas de técnicos." });
  }
  return { rows, columns: headers, errors };
}

/** Conteúdo do modelo CSV de importação (cabeçalho e uma linha de exemplo). */
export function buildTecnicosCsvTemplate(): string {
  const example = [
    "JOÃO DA SILVA",
    "T123456",
    "91",
    "BELÉM",
    "1234",
    "91999990000",
    "1234567",
    "12345678901",
    "FO|GPON",
    "S",
  ];
  return `${TECNICO_CSV_COLUMNS.join(";")}\n${example.join(";")}\n`;
}
