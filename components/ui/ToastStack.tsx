"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type ToastItem = {
  id: string;
  title: string;
  lines: string[];
  href?: string;
  actionLabel?: string;
  /** `danger` = estouro de SLA (visual distinto do chamado novo). */
  tone?: "default" | "danger";
};

type ToastStackProps = {
  items: ToastItem[];
  closeLabel: string;
  closeAllLabel: string;
  autoDismissMs: number;
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
};

type ToastCardProps = {
  item: ToastItem;
  closeLabel: string;
  autoDismissMs: number;
  onDismiss: (id: string) => void;
};

/** Duração da animação de saída; igual à de `toast-stack__item--leaving` em style.css. */
const TOAST_LEAVE_MS = 550;

/**
 * Pop-up individual: entra de baixo, permanece `autoDismissMs` e sobe ao fechar.
 * Remoção da lista ocorre por temporizador, independente do CSS carregado.
 */
function ToastCard({ item, closeLabel, autoDismissMs, onDismiss }: ToastCardProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLeaving(true), autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs]);

  useEffect(() => {
    if (!isLeaving) return;
    const timer = window.setTimeout(() => onDismiss(item.id), TOAST_LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [isLeaving, item.id, onDismiss]);

  const handleClose = () => setIsLeaving(true);

  const isSla = item.tone === "danger";
  const toneClass = isSla ? " toast-stack__item--sla" : " toast-stack__item--new";
  const icon = isSla ? "bi-exclamation-triangle-fill" : "bi-bell-fill";

  return (
    <div
      className={`toast-stack__item${toneClass}${isLeaving ? " toast-stack__item--leaving" : ""}`}
      role="alert"
    >
      <div className="toast-stack__header">
        <i className={`bi ${icon}`} aria-hidden="true" />
        <strong className="toast-stack__title">{item.title}</strong>
        {isSla ? <span className="toast-stack__tag">SLA</span> : null}
        <button
          type="button"
          className="btn-close btn-close-sm"
          aria-label={closeLabel}
          onClick={handleClose}
        />
      </div>
      {item.lines.map((line) => (
        <p key={line} className="toast-stack__line">
          {line}
        </p>
      ))}
      {item.href ? (
        <Link href={item.href} className="toast-stack__action" onClick={handleClose}>
          {item.actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

/** Pilha de pop-ups fixa no canto inferior direito (novos embaixo; saída sobe). */
export function ToastStack({
  items,
  closeLabel,
  closeAllLabel,
  autoDismissMs,
  onDismiss,
  onDismissAll,
}: ToastStackProps) {
  if (items.length === 0) return null;

  return (
    <div className="toast-stack" role="region" aria-live="polite" aria-label="Alertas">
      {items.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          closeLabel={closeLabel}
          autoDismissMs={autoDismissMs}
          onDismiss={onDismiss}
        />
      ))}
      {items.length > 1 ? (
        <button
          type="button"
          className="btn btn-sm btn-light toast-stack__close-all"
          onClick={onDismissAll}
        >
          {closeAllLabel} ({items.length})
        </button>
      ) : null}
    </div>
  );
}
