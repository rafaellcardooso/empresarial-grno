"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ContentCard } from "@/components/ui/ContentCard";
import { CardHeaderActions, ExportCsvLink } from "@/components/ui/CardHeaderActions";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { TablePagination } from "@/components/ui/TablePagination";
import { TableSearchField } from "@/components/ui/TableSearchField";
import { SdhFilterToolbar } from "@/components/sdh/SdhFilterToolbar";
import { SdhRecordsTable } from "@/components/sdh/SdhRecordsTable";
import { SdhStatusModal } from "@/components/sdh/SdhStatusModal";
import {
  SDH_VENDOR_LABELS,
  buildSdhFilterHref,
  sdhDddLabel,
  type SdhStatusFilter,
  type SdhVendorFilter,
} from "@/lib/config/sdh-filters";
import type {
  SdhAlarmListItem,
  SdhDddCount,
  SdhStatusCounts,
  SdhVendorCounts,
} from "@/lib/models/sdh";
import { formatNumberPtBr } from "@/lib/format/number";

type SdhPanelProps = {
  rows: SdhAlarmListItem[];
  total: number;
  vendorCounts: SdhVendorCounts;
  dddCounts: SdhDddCount[];
  statusCounts: SdhStatusCounts;
  activeVendor?: SdhVendorFilter;
  activeDdd?: string;
  activeStatus?: SdhStatusFilter;
  activeQ?: string;
  currentPage: number;
  pageSize: number;
  exportHref: string;
};

/** Painel SDH com filtros, KPIs de DDD, tabela e modal de STATUS. */
export function SdhPanel({
  rows,
  total,
  vendorCounts,
  dddCounts,
  statusCounts,
  activeVendor,
  activeDdd,
  activeStatus,
  activeQ,
  currentPage,
  pageSize,
  exportHref,
}: SdhPanelProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<SdhAlarmListItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleStatusClick = useCallback((alarm: SdhAlarmListItem) => {
    setSelected(alarm);
    setModalOpen(true);
  }, []);

  const handleSearchCommit = useCallback(
    (q: string | undefined) => {
      router.push(
        buildSdhFilterHref({
          vendor: activeVendor,
          ddd: activeDdd,
          status: activeStatus,
          q,
        }),
        { scroll: false },
      );
    },
    [activeDdd, activeStatus, activeVendor, router],
  );

  const handleClose = useCallback(() => {
    if (submitting) return;
    setModalOpen(false);
    setSelected(null);
  }, [submitting]);

  const patchStatus = useCallback(
    async (payload: { emTratativa: boolean; observacao?: string }) => {
      if (!selected) return;
      setSubmitting(true);
      try {
        const response = await fetch(`/api/sdh/${selected.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? "Falha ao atualizar status.");
        }
        setModalOpen(false);
        setSelected(null);
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Falha ao atualizar status.");
      } finally {
        setSubmitting(false);
      }
    },
    [router, selected],
  );

  const vendorLabel = activeVendor ? SDH_VENDOR_LABELS[activeVendor] : "Todos";
  const dddLabel = activeDdd ? sdhDddLabel(activeDdd) : undefined;
  const titleParts = ["SDH", vendorLabel];
  if (dddLabel) titleParts.push(dddLabel);
  const title = `${titleParts.join(" — ")} (${formatNumberPtBr(total)})`;

  return (
    <>
      <SdhFilterToolbar
        counts={vendorCounts}
        activeVendor={activeVendor}
        activeDdd={activeDdd}
        activeStatus={activeStatus}
        activeQ={activeQ}
      />

      <div className="card shadow-sm mb-3 sir-filter-toolbar">
        <div className="card-body py-3">
          <div className="sir-filter-toolbar__group">
            <span className="sir-filter-toolbar__heading">DDD</span>
            <div className="sir-filter-toolbar__chips">
              {dddCounts.map((item) => (
                <SirFilterChip
                  key={item.ddd}
                  label={sdhDddLabel(item.ddd)}
                  count={item.count}
                  href={buildSdhFilterHref({
                    vendor: activeVendor,
                    ddd: item.ddd,
                    status: activeStatus,
                    q: activeQ,
                  })}
                  active={activeDdd === item.ddd}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-2 mb-3">
        {[
          {
            key: "total",
            label: "Total",
            value: statusCounts.total,
            status: undefined,
            variant: "default" as const,
          },
          {
            key: "pending",
            label: "Pendente",
            value: statusCounts.pending,
            status: "pendente" as const,
            variant: "warning" as const,
          },
          {
            key: "in-progress",
            label: "Em tratativa",
            value: statusCounts.inProgress,
            status: "em-tratativa" as const,
            variant: "success" as const,
          },
        ].map((item) => (
          <div key={item.key} className="col-12 col-sm-4">
            <FilterMetricCard
              label={item.label}
              value={item.value}
              href={buildSdhFilterHref({
                vendor: activeVendor,
                ddd: activeDdd,
                status: item.status,
                q: activeQ,
              })}
              active={activeStatus === item.status}
              variant={item.variant}
            />
          </div>
        ))}
      </div>

      <ContentCard
        title={title}
        headerAside={
          <CardHeaderActions>
            <ExportCsvLink href={exportHref} />
          </CardHeaderActions>
        }
      >
        <TableSearchField
          value={activeQ}
          placeholder="Buscar por DDD, município, NE, porta, alarme, circuito ou login"
          onCommit={handleSearchCommit}
        />
        <SdhRecordsTable rows={rows} onStatusClick={handleStatusClick} />
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={total}
          buildPageHref={(page) =>
            buildSdhFilterHref({
              vendor: activeVendor,
              ddd: activeDdd,
              status: activeStatus,
              q: activeQ,
              page,
            })
          }
        />
      </ContentCard>

      <SdhStatusModal
        open={modalOpen}
        alarm={selected}
        submitting={submitting}
        onClose={handleClose}
        onSave={(payload) => void patchStatus(payload)}
        onClear={(observacao) => void patchStatus({ emTratativa: false, observacao })}
      />
    </>
  );
}
