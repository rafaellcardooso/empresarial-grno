/** Campos operacionais extraídos do tooltip SIR (detalhes / detalhes_title). */
export type SirDetalhesParsed = {
  contratoNetsales?: string;
  designacao?: string;
  razaoSocial?: string;
  endereco?: string;
  complemento?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  reclamante?: string;
  sintoma?: string;
};

const FIELD_ALIASES: Array<{ keys: keyof SirDetalhesParsed; labels: string[] }> = [
  { keys: "contratoNetsales", labels: ["CONTRATO NETSALES", "CONTRATO"] },
  { keys: "designacao", labels: ["Designação", "Designacao"] },
  { keys: "razaoSocial", labels: ["Razão Social", "Razao Social"] },
  { keys: "endereco", labels: ["ENDEREÇO", "ENDERECO"] },
  { keys: "complemento", labels: ["Complemento"] },
  { keys: "numero", labels: ["Número", "Numero"] },
  { keys: "bairro", labels: ["Bairro"] },
  { keys: "cidade", labels: ["Cidade"] },
  { keys: "uf", labels: ["UF"] },
  { keys: "cep", labels: ["CEP"] },
  { keys: "reclamante", labels: ["Reclamante"] },
  { keys: "sintoma", labels: ["SINTOMA", "Sintoma"] },
];

/** Extrai pares label:valor do texto de detalhes do SIR. */
export function parseSirDetalhes(raw: string | null | undefined): SirDetalhesParsed {
  const text = raw?.trim() ?? "";
  if (!text) return {};

  const parsed: SirDetalhesParsed = {};
  for (const { keys, labels } of FIELD_ALIASES) {
    const value = extractLabeledValue(text, labels);
    if (value) parsed[keys] = value;
  }

  return parsed;
}

function extractLabeledValue(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const pattern = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`${pattern}\\s*:\\s*([^\\n\\r]+)`, "i"));
    const value = match?.[1]?.replace(/\s+/g, " ").trim();
    if (value) return value;
  }
  return undefined;
}
