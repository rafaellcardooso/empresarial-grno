/** Registro espelhando a tabela `tbl_planta_instalada` (cópia diária de `db_planta.planta_instalada`). */
export type PlantaInstaladaRecord = {
  id: number;
  designacao_circuito: string | null;
  razao_social: string | null;
  num_pta: string | null;
  cep_pta: string | null;
  velocidade: string | null;
  risco_multa: string | null;
  estacao_entrega_acesso: string | null;
  descr_acesso_ponta: string | null;
  synced_at: Date | string;
};
