const FETCH_TIMEOUT_MS = 120_000;

/** Monta header Authorization Basic a partir de GRB_TELNET_*. */
export function getGrbBasicAuthHeader(username, password) {
  if (!username?.trim()) return {};
  const encoded = Buffer.from(`${username}:${password ?? ""}`).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}

/** Monta URL GET do Exportar em CSV (form formTctg / consultar(1)). */
export function buildTxCsvExportUrl(baseUrl, reportPath, idRede, potOptTxV = "-4;-2;0") {
  const root = String(baseUrl).replace(/\/$/, "");
  const path = reportPath.replace(/^\//, "");
  const url = new URL(`${root}/${path}`);
  url.searchParams.set("id_rede", String(idRede));
  url.searchParams.set("designacao", "");
  url.searchParams.set("rot", "");
  url.searchParams.set("serial", "");
  url.searchParams.set("rot_rem", "");
  url.searchParams.set("serial_rem", "");
  url.searchParams.set("diferenca", "");
  url.searchParams.set("acao", "consultar");
  url.searchParams.set("exportar_csv", "1");
  url.searchParams.set("POTOPT_TX_V", potOptTxV);
  url.searchParams.set("tcos", String(Date.now()));
  return url.toString();
}

/** GET texto/binário do GRB com timeout e Basic Auth. */
export async function fetchGrbText(url, authHeader) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        ...authHeader,
        Accept: "text/csv,application/octet-stream,*/*",
      },
    });
    if (!response.ok) {
      throw new Error(`GRB respondeu HTTP ${response.status} em ${url}`);
    }
    return {
      text: await response.text(),
      contentType: response.headers.get("content-type") || "",
      contentDisposition: response.headers.get("content-disposition") || "",
      finalUrl: response.url,
    };
  } catch (error) {
    const cause = error && typeof error === "object" ? error.cause : null;
    const code = cause && typeof cause === "object" ? cause.code : null;
    if (code === "UND_ERR_CONNECT_TIMEOUT" || code === "ENETUNREACH" || code === "EHOSTUNREACH") {
      throw new Error(
        `Sem rota até o GRB (${url}). Rode o worker num host com acesso a 200.255.253.12 (não use só o WSL sem rota).`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Indica se o corpo parece CSV do relatório TX. */
export function looksLikeTxCsv(text) {
  const head = String(text ?? "")
    .replace(/^\uFEFF/, "")
    .slice(0, 400)
    .toUpperCase();
  return head.includes("DESIGNACAO") && head.includes("TXPOWER_A");
}

/**
 * Baixa o CSV do relatório de potência óptica TX.
 * Endpoint canônico: acao=consultar&exportar_csv=1 (botão Exportar em CSV).
 */
export async function downloadTxCsv(config) {
  const {
    baseUrl,
    reportPath,
    idRede,
    username,
    password,
    potOptTxV = process.env.TX_POTOPT_TX_V?.trim() || "-4;-2;0",
  } = config;

  const authHeader = getGrbBasicAuthHeader(username, password);
  const csvUrl = buildTxCsvExportUrl(baseUrl, reportPath, idRede, potOptTxV);

  const result = await fetchGrbText(csvUrl, authHeader);
  if (looksLikeTxCsv(result.text)) {
    console.log(`[TX] CSV via exportar_csv=1 (${result.contentDisposition || result.contentType})`);
    return result.text;
  }

  throw new Error(
    "Resposta GRB não é o CSV esperado. Confira GRB_TELNET_* e se o formulário Exportar ainda usa exportar_csv=1.",
  );
}
