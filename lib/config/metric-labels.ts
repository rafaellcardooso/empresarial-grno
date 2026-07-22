/** Rótulos de KPIs, filtros e seções (caixa alta). */
export const METRIC_LABELS = {
  bsod: {
    totalPme: "TOTAL PME",
    online: "ONLINE",
    offline: "OFFLINE",
    semLeitura: "SEM LEITURA",
    comVlan: "COM VLAN BSOD",
    semVlan: "SEM VLAN BSOD",
    inventario: "INVENTÁRIO PME",
  },
  sir: {
    ral: "RAL",
    rec: "REC",
    recScope: "REC/DSR/TCQ",
    allTypes: "TODOS OS TIPOS",
    porCf: "POR CF EXECUTANTE",
  },
  table: {
    detalhes: "DETALHES",
  },
} as const;

/** Rótulos de status BSOD (caixa alta). */
export const BSOD_STATUS_LABELS = {
  online: "ONLINE",
  offline: "OFFLINE",
  semLeitura: "SEM LEITURA",
} as const;
