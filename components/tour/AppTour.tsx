"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { APP_TOUR_STEPS, resolveTourSteps } from "@/lib/config/tour-steps";
import { apiFetch } from "@/lib/config/base-path";

type AppTourProps = {
  shouldRun: boolean;
};

const TOUR_OPTIONS = {
  showProgress: true,
  animate: true,
  overlayOpacity: 0.55,
  nextBtnText: "Próximo",
  prevBtnText: "Anterior",
  doneBtnText: "Concluir",
  progressText: "{{current}} de {{total}}",
} as const;

/** Marca o tour como concluído na versão atual. */
function markTourCompleted() {
  apiFetch("/api/account/tour", { method: "POST" }).catch(() => undefined);
}

/** Monta e inicia o driver.js com os passos disponíveis na página. */
function startTour() {
  const steps = resolveTourSteps(APP_TOUR_STEPS);
  if (steps.length === 0) {
    markTourCompleted();
    return;
  }

  const tour = driver({
    ...TOUR_OPTIONS,
    steps,
    onDestroyed: markTourCompleted,
  });
  tour.drive();
}

/** Inicia tour guiado na primeira visita, após onboarding de região, ou nova versão. */
export function AppTour({ shouldRun }: AppTourProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!shouldRun || startedRef.current) return;
    startedRef.current = true;

    const timer = window.setTimeout(() => {
      startTour();
    }, 600);

    return () => window.clearTimeout(timer);
  }, [shouldRun]);

  return null;
}

/** Botão para reiniciar o tour manualmente. */
export function TourRestartButton() {
  /** Dispara tour sob demanda. */
  function handleRestart() {
    startTour();
  }

  return (
    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleRestart}>
      <i className="bi bi-compass me-1" aria-hidden="true" />
      Refazer tour
    </button>
  );
}
