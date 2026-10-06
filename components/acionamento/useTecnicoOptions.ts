"use client";

import { useEffect, useState } from "react";
import { TECNICO_LAST_DDD_STORAGE_KEY, TECNICO_LIST_MAX_PAGE_SIZE } from "@/lib/config/tecnicos";
import { fetchJson } from "@/lib/http/fetch-json";
import type { TecnicoListItem, TecnicoListResponse } from "@/lib/models/tecnico";

/** Lê o último DDD escolhido neste navegador (vazio quando indisponível). */
function readSavedDdd(): string {
  try {
    return window.localStorage.getItem(TECNICO_LAST_DDD_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Técnicos ativos do DDD escolhido para seletores (até TECNICO_LIST_MAX_PAGE_SIZE; `total` indica
 * lista parcial). DDD inicial: `defaultDdd`, senão o último salvo no localStorage.
 */
export function useTecnicoOptions(defaultDdd?: string) {
  const [ddd, setDddState] = useState(defaultDdd ?? "");
  const [isReady, setIsReady] = useState(Boolean(defaultDdd));
  const [options, setOptions] = useState<TecnicoListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultDdd) return;
    setDddState(readSavedDdd());
    setIsReady(true);
  }, [defaultDdd]);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    const params = new URLSearchParams({ limit: String(TECNICO_LIST_MAX_PAGE_SIZE) });
    if (ddd) params.set("ddd", ddd);
    void fetchJson<TecnicoListResponse>(`/api/tecnicos?${params.toString()}`, {
      cache: "no-store",
    }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setOptions([]);
        setTotal(0);
        return;
      }
      setError(null);
      setOptions(result.data.items);
      setTotal(result.data.total);
    });
    return () => {
      cancelled = true;
    };
  }, [ddd, isReady]);

  const setDdd = (value: string) => {
    setDddState(value);
    try {
      window.localStorage.setItem(TECNICO_LAST_DDD_STORAGE_KEY, value);
    } catch {
      // Armazenamento indisponível: DDD não é lembrado na próxima abertura.
    }
  };

  return { ddd, setDdd, options, total, error, setError, isPartial: total > options.length };
}
