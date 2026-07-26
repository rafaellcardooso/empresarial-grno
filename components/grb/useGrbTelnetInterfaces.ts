"use client";

import { useEffect, useState } from "react";
import { GRB_DEFAULT_ID_REDE } from "@/lib/config/grb";

type UseGrbTelnetInterfacesInput = {
  baseUrl: string;
  eqpto: string;
};

/** Carrega interfaces do equipamento via GET /api/grb/interfaces. */
export function useGrbTelnetInterfaces({ baseUrl, eqpto }: UseGrbTelnetInterfacesInput) {
  const [interfaceOptions, setInterfaceOptions] = useState<string[]>([]);
  const [interfacesLoading, setInterfacesLoading] = useState(false);
  const [interfacesError, setInterfacesError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseUrl.trim() || !eqpto) {
      setInterfaceOptions([]);
      setInterfacesError(null);
      return;
    }

    const controller = new AbortController();
    setInterfacesLoading(true);
    setInterfacesError(null);

    const params = new URLSearchParams({
      eqpto,
      id_rede: String(GRB_DEFAULT_ID_REDE),
    });

    fetch(`/api/grb/interfaces?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as {
          interfaces?: string[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao carregar interfaces.");
        }
        setInterfaceOptions(Array.isArray(payload.interfaces) ? payload.interfaces : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setInterfaceOptions([]);
        setInterfacesError(
          error instanceof Error ? error.message : "Falha ao carregar interfaces.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setInterfacesLoading(false);
        }
      });

    return () => controller.abort();
  }, [baseUrl, eqpto]);

  return { interfaceOptions, interfacesLoading, interfacesError };
}
