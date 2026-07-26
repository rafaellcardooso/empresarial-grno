export type GrbCommandPreset = {
  id: string;
  label: string;
  /** Valor de sel_cmds no GRB (prefixo de 6 chars + comando). */
  templateValue: string;
  requiresIp: boolean;
  requiresInterface: boolean;
  requiresVrf: boolean;
  requiresWord: boolean;
};
