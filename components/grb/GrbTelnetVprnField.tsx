import { GrbTelnetVprnManualInput } from "@/components/grb/GrbTelnetVprnManualInput";
import { GrbTelnetVprnSelected } from "@/components/grb/GrbTelnetVprnSelected";
import { GrbTelnetVprnTable, VPRN_PAGE_SIZE } from "@/components/grb/GrbTelnetVprnTable";
import { GrbTelnetVprnToolbar } from "@/components/grb/GrbTelnetVprnToolbar";
import { FIELD_LABELS } from "@/lib/config/grb-telnet-ui";
import type { VprnEntry } from "@/lib/grb/telnet-vprn";

export type GrbTelnetVprnFieldProps = {
  hint: string;
  eqpto: string;
  isExecuting: boolean;
  needsVprnServiceId: boolean;
  vprnRouterInstance: string;
  vprnServiceId: string;
  vprnEntries: VprnEntry[];
  vprnPage: number;
  vprnLoading: boolean;
  vprnError: string | null;
  vprnManual: boolean;
  vprnFilter: string;
  onLoadVprn: () => void;
  onClearSelection: () => void;
  onSelectVprn: (entry: VprnEntry) => void;
  onManualChange: (value: string) => void;
  onSetManual: (manual: boolean) => void;
  onSetFilter: (value: string) => void;
  onSetPage: (page: number | ((current: number) => number)) => void;
};

/** Campo VPRN Nokia — lista paginada, filtro e entrada manual. */
export function GrbTelnetVprnField({
  hint,
  eqpto,
  isExecuting,
  needsVprnServiceId,
  vprnRouterInstance,
  vprnServiceId,
  vprnEntries,
  vprnPage,
  vprnLoading,
  vprnError,
  vprnManual,
  vprnFilter,
  onLoadVprn,
  onClearSelection,
  onSelectVprn,
  onManualChange,
  onSetManual,
  onSetFilter,
  onSetPage,
}: GrbTelnetVprnFieldProps) {
  const showVprnList = !vprnManual && vprnEntries.length > 0;
  const query = vprnFilter.trim().toLowerCase();
  const filteredVprnEntries = query
    ? vprnEntries.filter(
        (entry) => entry.name.toLowerCase().includes(query) || entry.serviceId.includes(query),
      )
    : vprnEntries;
  const vprnPageCount = Math.max(1, Math.ceil(filteredVprnEntries.length / VPRN_PAGE_SIZE));
  const vprnPageItems = filteredVprnEntries.slice(
    vprnPage * VPRN_PAGE_SIZE,
    vprnPage * VPRN_PAGE_SIZE + VPRN_PAGE_SIZE,
  );

  return (
    <div className="col-12">
      <label className="form-label grb-panel__label">{FIELD_LABELS.vrf}</label>
      <p className="text-body-secondary small mb-2">{hint}</p>

      <div className="grb-panel__vprn-box">
        <GrbTelnetVprnToolbar
          eqpto={eqpto}
          isExecuting={isExecuting}
          vprnLoading={vprnLoading}
          vprnEntriesCount={vprnEntries.length}
          showVprnList={showVprnList}
          vprnFilter={vprnFilter}
          onLoadVprn={onLoadVprn}
          onSetManual={onSetManual}
          onSetFilter={onSetFilter}
        />

        {vprnError ? <div className="form-text text-danger mb-2">{vprnError}</div> : null}

        <GrbTelnetVprnSelected
          isExecuting={isExecuting}
          needsVprnServiceId={needsVprnServiceId}
          vprnRouterInstance={vprnRouterInstance}
          vprnServiceId={vprnServiceId}
          onClearSelection={onClearSelection}
        />

        {showVprnList ? (
          <GrbTelnetVprnTable
            isExecuting={isExecuting}
            vprnRouterInstance={vprnRouterInstance}
            vprnPage={vprnPage}
            vprnFilter={vprnFilter}
            filteredEntries={filteredVprnEntries}
            pageItems={vprnPageItems}
            pageCount={vprnPageCount}
            onSelectVprn={onSelectVprn}
            onSetPage={onSetPage}
          />
        ) : !vprnLoading ? (
          <GrbTelnetVprnManualInput
            isExecuting={isExecuting}
            needsVprnServiceId={needsVprnServiceId}
            vprnRouterInstance={vprnRouterInstance}
            vprnServiceId={vprnServiceId}
            vprnEntriesCount={vprnEntries.length}
            vprnError={vprnError}
            solo={vprnEntries.length === 0}
            onManualChange={onManualChange}
          />
        ) : null}
      </div>
    </div>
  );
}
