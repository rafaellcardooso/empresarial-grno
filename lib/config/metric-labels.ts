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
    ralOpen: "RAL EM ABERTO",
    recOpen: "REC EM ABERTO",
    totalRal: "TOTAL RAL",
    closedRal: "RAL ENCERRADAS",
    closedRec: "ENCERRADOS",
    allRecords: "TODOS",
    porCf: "POR CF EXECUTANTE",
    registros: "REGISTROS",
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
