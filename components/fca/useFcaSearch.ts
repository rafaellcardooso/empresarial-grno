"use client";

import { useCallback, useState } from "react";
import { FCA_COPY, FCA_SEARCH_MIN_LENGTH } from "@/lib/config/fca";
import { fetchJson } from "@/lib/http/fetch-json";
import type { FcaRecord, FcaSearchResponse } from "@/lib/models/fca";

/** Estado e execução da busca de chamados RAL/REC do FCA. */
export function useFcaSearch() {
  const [term, setTerm] = useState("");
  const [items, setItems] = useState<FcaRecord[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    const query = term.trim();
    if (query.length < FCA_SEARCH_MIN_LENGTH) {
      setError(FCA_COPY.searchTooShort);
      return;
    }
    setIsLoading(true);
    setError(null);
    const result = await fetchJson<FcaSearchResponse>(
      `/api/fca/search?${new URLSearchParams({ q: query }).toString()}`,
      { cache: "no-store" },
    );
    setIsLoading(false);
    setHasSearched(true);
    if (!result.ok) {
      setError(result.error);
      setItems([]);
      setHasMore(false);
      return;
    }
    setItems(result.data.items);
    setHasMore(result.data.hasMore);
  }, [term]);

  return { term, setTerm, items, hasMore, isLoading, hasSearched, error, search };
}
