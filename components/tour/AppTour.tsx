"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { APP_TOUR_STEPS } from "@/lib/config/tour-steps";

type AppTourProps = {
  shouldRun: boolean;
};

/** Inicia tour guiado na primeira visita ou nova versão. */
export function AppTour({ shouldRun }: AppTourProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!shouldRun || startedRef.current) return;
    startedRef.current = true;

    const timer = window.setTimeout(() => {
      const tour = driver({
        showProgress: true,
        animate: true,
        overlayOpacity: 0.55,
        nextBtnText: "Próximo",
        prevBtnText: "Anterior",
        doneBtnText: "Concluir",
        progressText: "{{current}} de {{total}}",
        steps: APP_TOUR_STEPS,
        onDestroyed: () => {
          fetch("/api/account/tour", { method: "POST" }).catch(() => undefined);
        },
      });

      tour.drive();
    }, 600);

    return () => window.clearTimeout(timer);
  }, [shouldRun]);

  return null;
}

/** Botão para reiniciar o tour manualmente. */
export function TourRestartButton() {
  /** Dispara tour sob demanda. */
  function handleRestart() {
    const tour = driver({
      showProgress: true,
      animate: true,
      overlayOpacity: 0.55,
      nextBtnText: "Próximo",
      prevBtnText: "Anterior",
      doneBtnText: "Concluir",
      progressText: "{{current}} de {{total}}",
      steps: APP_TOUR_STEPS,
      onDestroyed: () => {
        fetch("/api/account/tour", { method: "POST" }).catch(() => undefined);
      },
    });
    tour.drive();
  }

  return (
    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleRestart}>
      <i className="bi bi-compass me-1" aria-hidden="true" />
      Refazer tour
    </button>
  );
}
