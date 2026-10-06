"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type ToastItem = {
  id: string;
  title: string;
  lines: string[];
  href?: string;
  actionLabel?: string;
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
const TOAST_LEAVE_MS = 300;

/**
 * Pop-up individual com animação de entrada e saída subindo; fecha sozinho após `autoDismissMs`.
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

  return (
    <div
      className={`toast-stack__item${isLeaving ? " toast-stack__item--leaving" : ""}`}
      role="alert"
    >
      <div className="toast-stack__header">
        <i className="bi bi-bell-fill" aria-hidden="true" />
        <strong className="toast-stack__title">{item.title}</strong>
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

/** Pilha de pop-ups fixa no canto superior direito. */
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
      {items.length > 1 ? (
        <button
          type="button"
          className="btn btn-sm btn-light toast-stack__close-all"
          onClick={onDismissAll}
        >
          {closeAllLabel} ({items.length})
        </button>
      ) : null}
      {items.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          closeLabel={closeLabel}
          autoDismissMs={autoDismissMs}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
