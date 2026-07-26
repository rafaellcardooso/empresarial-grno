"use client";

import { GrbTelnetCommandFields } from "@/components/grb/GrbTelnetCommandFields";
import { GrbTelnetCommandSelect } from "@/components/grb/GrbTelnetCommandSelect";
import { GrbTelnetEquipmentSection } from "@/components/grb/GrbTelnetEquipmentSection";
import { GrbTelnetExecuteFeedback } from "@/components/grb/GrbTelnetExecuteFeedback";
import { GrbTelnetFormSubmit } from "@/components/grb/GrbTelnetFormSubmit";
import { GrbTelnetPreviewCard } from "@/components/grb/GrbTelnetOutputCards";
import { GrbTelnetUfSelector } from "@/components/grb/GrbTelnetUfSelector";
import { useGrbTelnetPanel } from "@/components/grb/useGrbTelnetPanel";
import { ContentCard } from "@/components/ui/ContentCard";
import { useSession } from "@/components/layout/SessionProvider";

type GrbTelnetPanelProps = {
  baseUrl: string;
};

/** Formulário TELNET GRB — UF, equipamento, comando e campos dinâmicos por plataforma. */
export function GrbTelnetPanel({ baseUrl }: GrbTelnetPanelProps) {
  const { user } = useSession();
  const panel = useGrbTelnetPanel({ baseUrl, userRole: user.role });

  return (
    <div className="grb-panel d-flex flex-column gap-3">
      {!baseUrl.trim() ? (
        <div className="alert alert-warning mb-0" role="alert">
          GRB não configurado. Defina <code>GRB_BASE_URL</code> em <code>.env.local</code> e
          reinicie o servidor.
        </div>
      ) : null}

      <ContentCard title="TELNET" bodyClassName="p-3">
        <p className="text-body-secondary small mb-3">
          Selecione UF e equipamento, escolha o comando e preencha os campos. Equipamentos Nokia
          usam router-instance (VPRN) quando aplicável{panel.introSuffix}
        </p>

        <form className="grb-panel__form" onSubmit={panel.handleSubmit}>
          <GrbTelnetUfSelector {...panel.ufSection} />
          <GrbTelnetEquipmentSection {...panel.equipmentSection} />
          <GrbTelnetCommandSelect {...panel.commandSection} />

          {panel.commandFields.fields.length > 0 ? (
            <div className="row g-3 mb-3">
              <GrbTelnetCommandFields {...panel.commandFields} />
            </div>
          ) : null}

          <GrbTelnetFormSubmit
            baseUrl={baseUrl}
            eqpto={panel.eqpto}
            isExecuting={panel.isExecuting}
            formError={panel.formError}
          />
        </form>
      </ContentCard>

      <GrbTelnetPreviewCard
        commandPreview={panel.commandPreview}
        copyFeedback={panel.copyFeedback}
        onCopy={panel.handleCopy}
      />

      <GrbTelnetExecuteFeedback
        executeError={panel.executeError}
        executeResult={panel.executeResult}
        onCopy={panel.handleCopy}
      />
    </div>
  );
}
