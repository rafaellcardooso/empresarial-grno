"use client";

import { AppTour } from "@/components/tour/AppTour";
import { useSession } from "@/components/layout/SessionProvider";

/** Dispara tour guiado quando necessário (dados vêm do SessionProvider). */
export function AppTourProvider() {
  const { tourShouldRun } = useSession();
  return <AppTour shouldRun={tourShouldRun} />;
}
