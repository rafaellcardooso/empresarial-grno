"use client";

import Link from "next/link";
import { SHELL_ALERTS_COPY, sirAgeAlertHref } from "@/lib/config/shell-alerts";
import type { SirAgeAlertRecord } from "@/lib/models/shell-alerts";

type AgeAlertCenterProps = {
  items: SirAgeAlertRecord[];
  onDismiss: () => void;
};

/** Item de chamado no modal central de idade/SLA. */
function AgeAlertRow({ item, onOpen }: { item: SirAgeAlertRecord; onOpen: () => void }) {
  return (
    <li className={`age-alert-center__item age-alert-center__item--${item.level}`}>
      <div className="age-alert-center__item-main">
        <span className="age-alert-center__tag">
          {SHELL_ALERTS_COPY.ageToastTag(item.kind, item.level)}
        </span>
        <strong className="age-alert-center__num">
          {item.kind} {item.numRecup}
        </strong>
        <span className="age-alert-center__meta">
          {item.cf.replace(/\s+/g, " ").trim() || "—"} · {item.ageHours}h
        </span>
        {item.summary ? (
          <span className="age-alert-center__summary">{item.summary.trim().slice(0, 120)}</span>
        ) : null}
      </div>
      <Link
        href={sirAgeAlertHref(item)}
        className="btn btn-sm btn-outline-secondary age-alert-center__open"
        onClick={onOpen}
      >
        {SHELL_ALERTS_COPY.open}
      </Link>
    </li>
  );
}

/** Modal central com alertas amarelos (atenção) e vermelhos (SLA). */
export function AgeAlertCenter({ items, onDismiss }: AgeAlertCenterProps) {
  if (items.length === 0) return null;

  const overItems = items.filter((item) => item.level === "over");
  const warnItems = items.filter((item) => item.level === "warn");
  const hasOver = overItems.length > 0;

  return (
    <div
      className="age-alert-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="age-alert-center-title"
    >
      <button
        type="button"
        className="age-alert-center__backdrop"
        aria-label={SHELL_ALERTS_COPY.close}
        onClick={onDismiss}
      />
      <div className="age-alert-center__card">
        <div className="age-alert-center__header">
          <span
            className={`age-alert-center__icon age-alert-center__icon--${hasOver ? "over" : "warn"}`}
            aria-hidden="true"
          >
            <i
              className={`bi ${hasOver ? "bi-exclamation-octagon-fill" : "bi-exclamation-triangle-fill"}`}
            />
          </span>
          <div>
            <h2 className="age-alert-center__title" id="age-alert-center-title">
              {SHELL_ALERTS_COPY.ageCenterTitle}
            </h2>
            <p className="age-alert-center__lead">{SHELL_ALERTS_COPY.ageCenterLead}</p>
          </div>
        </div>

        <div className="age-alert-center__sections">
          {warnItems.length > 0 ? (
            <section className="age-alert-center__section">
              <h3 className="age-alert-center__section-title age-alert-center__section-title--warn">
                {SHELL_ALERTS_COPY.ageCenterWarnSection}
              </h3>
              <ul className="age-alert-center__list">
                {warnItems.map((item) => (
                  <AgeAlertRow
                    key={`${item.kind}:${item.numRecup}:warn`}
                    item={item}
                    onOpen={onDismiss}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {overItems.length > 0 ? (
            <section className="age-alert-center__section">
              <h3 className="age-alert-center__section-title age-alert-center__section-title--over">
                {SHELL_ALERTS_COPY.ageCenterOverSection}
              </h3>
              <ul className="age-alert-center__list">
                {overItems.map((item) => (
                  <AgeAlertRow
                    key={`${item.kind}:${item.numRecup}:over`}
                    item={item}
                    onOpen={onDismiss}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="age-alert-center__footer">
          <button type="button" className="btn btn-primary" onClick={onDismiss}>
            {SHELL_ALERTS_COPY.dismissAge}
          </button>
        </div>
      </div>
    </div>
  );
}
