/** Tipos de alarme aceitos na exibição SDH para Tellabs e Alcatel (legado SPI). */
export const SDH_ALLOWED_ALARMES = [
  "loss of signal",
  "ais",
  "loss of frame",
  "fan failure",
  "fan degraded",
  "rdi",
  "stm-1 loss of input signal",
  "communication-transport  stm64 port  loss of frame",
  "equipment  fan  fan voltage feed b failure",
  "vc-4 loss of multiframe",
  "connection failed",
  "stm-1 ms remote defect indicator",
] as const;

type SdhAllowedAlarme = (typeof SDH_ALLOWED_ALARMES)[number];

/**
 * Equivalência Datacom de cada tipo em `SDH_ALLOWED_ALARMES`; a gerência Datacom usa
 * nomenclatura própria (`rs-los alarm activated` em vez de `loss of signal`).
 * Tipos sem correspondente Datacom ficam fora do mapa.
 */
export const SDH_DATACOM_ALARM_EQUIVALENTS: Partial<Record<SdhAllowedAlarme, readonly string[]>> = {
  "loss of signal": ["rs-los alarm activated", "aggregate link detecting los."],
  "stm-1 loss of input signal": ["rs-los alarm activated"],
  "loss of frame": ["rs-lof alarm activated"],
  ais: ["ms-ais alarm activated", "au-ais alarm activated", "hp-ais alarm activated"],
  rdi: ["hp-rdi alarm activated", "alarm in remote port detected."],
  "stm-1 ms remote defect indicator": ["ms-rdi alarm activated"],
  "vc-4 loss of multiframe": ["hp-lom alarm activated"],
  "fan failure": ["fan-failure alarm activated"],
  "fan degraded": ["fan-degraded alarm activated"],
};

/** Tipos de alarme Datacom aceitos na exibição SDH (valores únicos do mapa de equivalência). */
export const SDH_DATACOM_ALLOWED_ALARMES: readonly string[] = [
  ...new Set(Object.values(SDH_DATACOM_ALARM_EQUIVALENTS).flat()),
];
