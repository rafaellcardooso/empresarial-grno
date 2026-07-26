const PROMPT_ECHO_LINE_RE = /^([A-Za-z0-9][\w.:/-]*#)\s*/;

/** Substitui a linha de eco do prompt pelo comando enviado, sem alterar a resposta. */
export function replaceTelnetPromptEcho(output: string, command: string): string {
  if (!output || !command) return output;
  if (output.startsWith("ERRO:")) return output;

  const lines = output.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length === 0) return output;

  const match = (lines[0] ?? "").trimStart().match(PROMPT_ECHO_LINE_RE);
  if (match?.[1]) {
    lines[0] = `${match[1]}${command}`;
  }

  return lines.join("\n");
}
