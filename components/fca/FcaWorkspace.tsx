"use client";

import { useCallback, useMemo, useState } from "react";
import { FcaHeaderCard } from "@/components/fca/FcaHeaderCard";
import { FcaPreviewCard } from "@/components/fca/FcaPreviewCard";
import { FcaSearchCard } from "@/components/fca/FcaSearchCard";
import { FcaTextCard } from "@/components/fca/FcaTextCard";
import { useSession } from "@/components/layout/SessionProvider";
import { EMPTY_FCA_HEADER, EMPTY_FCA_TEXT, fcaHeaderFromRecord } from "@/lib/config/fca";
import { buildFcaText, getFcaCopyBlocker } from "@/lib/fca/build-fca-text";
import type { FcaHeaderFields, FcaRecord, FcaTextFields } from "@/lib/models/fca";

/** Área de montagem do FCA: busca do chamado, dados do cliente, Fato/Causa/Ação e cópia. */
export function FcaWorkspace() {
  const { user } = useSession();
  const [selectedNum, setSelectedNum] = useState<string | null>(null);
  const [header, setHeader] = useState<FcaHeaderFields>(EMPTY_FCA_HEADER);
  const [text, setText] = useState<FcaTextFields>(EMPTY_FCA_TEXT);

  const responsavel = `${user.name} (${user.corporateId})`;
  const preview = useMemo(
    () => buildFcaText(header, text, responsavel),
    [header, text, responsavel],
  );

  const handleSelect = useCallback((record: FcaRecord) => {
    setSelectedNum(record.numRecup);
    setHeader(fcaHeaderFromRecord(record));
  }, []);

  const handleHeaderChange = useCallback((key: keyof FcaHeaderFields, value: string) => {
    setHeader((current) => ({ ...current, [key]: value }));
  }, []);

  const handleTextChange = useCallback((key: keyof FcaTextFields, value: string) => {
    setText((current) => ({ ...current, [key]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setSelectedNum(null);
    setHeader(EMPTY_FCA_HEADER);
    setText(EMPTY_FCA_TEXT);
  }, []);

  return (
    <>
      <FcaSearchCard selectedNum={selectedNum} onSelect={handleSelect} />
      <div className="fca-layout">
        <div>
          <FcaHeaderCard header={header} responsavel={responsavel} onChange={handleHeaderChange} />
          <FcaTextCard text={text} onChange={handleTextChange} />
        </div>
        <div className="fca-layout__aside">
          <FcaPreviewCard
            preview={preview}
            copyBlocker={getFcaCopyBlocker(header, text)}
            onClear={handleClear}
          />
        </div>
      </div>
    </>
  );
}
