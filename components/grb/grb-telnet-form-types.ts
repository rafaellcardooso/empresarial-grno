import type { VprnEntry } from "@/lib/grb/telnet-vprn";

export type GrbTelnetExecuteResult = {
  command: string;
  output: string;
};

export type GrbTelnetVprnFieldState = {
  routerInstance: string;
  serviceId: string;
  entries: VprnEntry[];
  page: number;
  loading: boolean;
  error: string | null;
  manual: boolean;
  filter: string;
  onLoad: () => void;
  onClear: () => void;
  onSelect: (entry: VprnEntry) => void;
  onManualChange: (value: string) => void;
  onSetManual: (manual: boolean) => void;
  onSetFilter: (value: string) => void;
  onSetPage: (page: number | ((current: number) => number)) => void;
};
