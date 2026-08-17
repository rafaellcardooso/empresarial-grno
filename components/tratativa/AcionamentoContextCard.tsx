import type { ReactNode } from "react";
import { recGroupDisplayLabel } from "@/lib/config/rec-types";
import type { AcionamentoContext } from "@/lib/models/acionamento";

type AcionamentoContextCardProps = {
  context: AcionamentoContext;
};

/** Resumo read-only do registro usado na prévia do acionamento. */
export function AcionamentoContextCard({ context }: AcionamentoContextCardProps) {
  if (context.recordKind === "BSOD") {
    const items = [
      { label: "Cliente", value: context.cliente },
      { label: "Razão social", value: context.cadastroResponsavel },
      { label: "Designação", value: context.designacao },
      { label: "Produto", value: context.produto },
      { label: "Contrato", value: context.contrato },
      { label: "CMTS", value: context.cmts },
      { label: "Node", value: context.node },
      { label: "MAC", value: context.mac ?? context.recordKey },
      { label: "Profile", value: context.profile },
      { label: "Status", value: context.monitorLabel },
      { label: "Endereço", value: context.address },
    ];

    return (
      <ContextCardShell title="Registro BSOD">
        {items.map(({ label, value }) => (
          <ContextItem key={label} label={label} value={value} />
        ))}
      </ContextCardShell>
    );
  }

  if (context.recordKind === "SDH") {
    const items = [
      { label: "DDD", value: context.ddd },
      { label: "Município", value: context.municipio },
      { label: "NE", value: context.ne },
      { label: "Porta", value: context.porta },
      { label: "Alarme", value: context.alarme },
      { label: "Circuito", value: context.circuito },
      { label: "SIR", value: context.sir },
      { label: "IP", value: context.ip },
    ];
    return (
      <ContextCardShell title="Registro SDH">
        {items.map(({ label, value }) => (
          <ContextItem key={label} label={label} value={value} />
        ))}
      </ContextCardShell>
    );
  }

  const items = [
    { label: "Número", value: context.numRecup },
    { label: "Contrato NETSALES", value: context.contratoNetsales },
    { label: "Designação", value: context.designacao },
    { label: "Razão social", value: context.razaoSocial },
    { label: "Endereço", value: context.endereco },
    { label: "Complemento", value: context.complemento },
    { label: "Bairro", value: context.bairro },
    { label: "Cidade", value: context.cidade },
    { label: "UF", value: context.uf },
    { label: "CEP", value: context.cep },
    { label: "Reclamante", value: context.reclamante },
  ];

  const sirLabel =
    context.recordKind === "RAL"
      ? "RAL"
      : recGroupDisplayLabel(context.numRecup || context.recordKey);

  return (
    <ContextCardShell title={`Registro ${sirLabel}`}>
      {items.map(({ label, value }) => (
        <ContextItem key={label} label={label} value={value} />
      ))}
    </ContextCardShell>
  );
}

type ContextCardShellProps = {
  title: string;
  children: ReactNode;
};

function ContextCardShell({ title, children }: ContextCardShellProps) {
  return (
    <div className="acionamento-context-card">
      <p className="acionamento-context-card__title">{title}</p>
      <dl className="acionamento-context-card__grid">{children}</dl>
    </div>
  );
}

type ContextItemProps = {
  label: string;
  value?: string | null;
};

function ContextItem({ label, value }: ContextItemProps) {
  return (
    <div className="acionamento-context-card__item">
      <dt>{label}</dt>
      <dd>{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
