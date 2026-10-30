/** Base do portal SIR oficial (deep link de tarefa RAL/REC). */
export const SIR_PORTAL_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SIR_PORTAL_BASE_URL?.trim()) ||
  "https://sir.sacorp.nocclaro.com.br";

/** Path relativo da tarefa REC/DSR/TCQ no frameset do SIR. */
export const SIR_PORTAL_TAREFA_REC_PATH = "/navegacao/framesetNivel2TarefaRec.cfm";

/** Path relativo da tarefa RAL no frameset do SIR. */
export const SIR_PORTAL_TAREFA_RAL_PATH = "/navegacao/framesetNivel2TarefaRal.cfm";
