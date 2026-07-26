export type GrbTelnetHtmlPrefill = {
  selCmds?: string;
  ipNetwork?: string;
  networkInterface?: string;
  vrfName?: string;
  word?: string;
};

type PatchGrbTelnetHtmlOptions = {
  baseHref: string;
  prefill: GrbTelnetHtmlPrefill;
};

/** Escapa texto para atributo HTML. */
function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Escapa valor para uso em RegExp. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Define value= em input pelo id quando o campo existir no HTML. */
function setInputValue(html: string, id: string, value: string | undefined): string {
  if (!value?.trim()) return html;

  const escaped = escapeHtmlAttribute(value.trim());
  const pattern = new RegExp(`(<input[^>]*id=['"]${id}['"][^>]*value=['"])([^'"]*)(['"])`, "i");

  if (pattern.test(html)) {
    return html.replace(pattern, `$1${escaped}$3`);
  }

  return html;
}

/** Marca option selected em select pelo id. */
function setSelectValue(html: string, selectId: string, value: string | undefined): string {
  if (!value?.trim()) return html;

  const trimmed = value.trim();
  const selectPattern = new RegExp(
    `<select[^>]*id=['"]${selectId}['"][^>]*>[\\s\\S]*?<\\/select>`,
    "i",
  );

  const match = html.match(selectPattern);
  if (!match) return html;

  const optionPattern = new RegExp(`(<option\\s+value=['"])${escapeRegex(trimmed)}(['"])`, "i");

  if (!optionPattern.test(match[0])) return html;

  const updatedBlock = match[0]
    .replace(/\sselected(?=\s|>|\/)/gi, "")
    .replace(optionPattern, `$1${trimmed}$2 selected`);

  return html.replace(selectPattern, updatedBlock);
}

/** Insere base href para assets relativos do GRB. */
function ensureBaseHref(html: string, baseHref: string): string {
  if (/<base\s/i.test(html)) return html;

  const baseTag = `<base href="${escapeHtmlAttribute(baseHref)}">`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`);
  }

  return `${baseTag}${html}`;
}

/** Gera IIFE que pré-preenche sel_cmds e chama filtro_comandos. */
function buildPrefillJs(prefill: GrbTelnetHtmlPrefill): string {
  const payload = JSON.stringify({
    sel_cmds: prefill.selCmds?.trim() ?? "",
    ip_network: prefill.ipNetwork?.trim() ?? "",
    interface: prefill.networkInterface?.trim() ?? "",
    vrf_name: prefill.vrfName?.trim() ?? "",
    word: prefill.word?.trim() ?? "",
  });

  return `(function(){var p=${payload};function set(id,key){if(!p[key])return;var el=document.getElementById(id);if(el)el.value=p[key];}set("sel_cmds","sel_cmds");set("ip_network","ip_network");set("interface","interface");set("vrf_name","vrf_name");set("word","word");if(typeof filtro_comandos==="function")filtro_comandos(p.sel_cmds?1:0);})();`;
}

/** Substitui apenas a chamada final filtro_comandos(0) antes de </script>. */
function injectPrefillScript(html: string, prefill: GrbTelnetHtmlPrefill): string {
  const js = buildPrefillJs(prefill);
  const endScriptPattern = /filtro_comandos\s*\(\s*0\s*\)\s*;\s*(?=<\/script>)/i;

  if (endScriptPattern.test(html)) {
    return html.replace(endScriptPattern, `${js}`);
  }

  return html.replace(/<\/body>/i, `<script>${js}</script></body>`);
}

/** Aplica base href, valores de input e seleção de comando no HTML do GRB. */
export function patchGrbTelnetHtml(html: string, options: PatchGrbTelnetHtmlOptions): string {
  let patched = ensureBaseHref(html, options.baseHref);
  patched = setInputValue(patched, "ip_network", options.prefill.ipNetwork);
  patched = setInputValue(patched, "interface", options.prefill.networkInterface);
  patched = setInputValue(patched, "vrf_name", options.prefill.vrfName);
  patched = setInputValue(patched, "word", options.prefill.word);
  patched = setSelectValue(patched, "sel_cmds", options.prefill.selCmds);
  patched = injectPrefillScript(patched, options.prefill);
  return patched;
}
