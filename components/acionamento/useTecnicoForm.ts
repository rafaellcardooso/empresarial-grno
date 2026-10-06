"use client";

import { useEffect, useState } from "react";
import type { TecnicoSkill } from "@/lib/config/tecnicos";
import { fetchJson } from "@/lib/http/fetch-json";
import type { Tecnico } from "@/lib/models/tecnico";

export type TecnicoFormState = {
  nome: string;
  login: string;
  ddd: string;
  cidade: string;
  un: string;
  telefone: string;
  rg: string;
  cpf: string;
  ativo: boolean;
  skills: TecnicoSkill[];
};

const EMPTY_FORM: TecnicoFormState = {
  nome: "",
  login: "",
  ddd: "",
  cidade: "",
  un: "",
  telefone: "",
  rg: "",
  cpf: "",
  ativo: true,
  skills: [],
};

/** Converte técnico carregado da API em estado do formulário. */
function toFormState(tecnico: Tecnico): TecnicoFormState {
  return {
    nome: tecnico.nome,
    login: tecnico.login,
    ddd: tecnico.ddd,
    cidade: tecnico.cidade,
    un: tecnico.un ?? "",
    telefone: tecnico.telefone ?? "",
    rg: tecnico.rg ?? "",
    cpf: tecnico.cpf ?? "",
    ativo: tecnico.ativo,
    skills: tecnico.skills,
  };
}

/** Estado do formulário de técnico: carrega dados completos na edição e salva via POST/PUT. */
export function useTecnicoForm(tecnicoId: number | null, onSaved: () => void) {
  const [form, setForm] = useState<TecnicoFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(tecnicoId !== null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tecnicoId === null) return;
    let cancelled = false;
    void fetchJson<{ tecnico: Tecnico }>(`/api/tecnicos/${tecnicoId}`, { cache: "no-store" }).then(
      (result) => {
        if (cancelled) return;
        setIsLoading(false);
        if (result.ok) setForm(toFormState(result.data.tecnico));
        else setError(result.error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [tecnicoId]);

  const setField = <K extends keyof TecnicoFormState>(key: K, value: TecnicoFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleSkill = (skill: TecnicoSkill) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.includes(skill)
        ? current.skills.filter((item) => item !== skill)
        : [...current.skills, skill],
    }));
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    const result = await fetchJson<{ ok: boolean }>(
      tecnicoId === null ? "/api/tecnicos" : `/api/tecnicos/${tecnicoId}`,
      {
        method: tecnicoId === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
  };

  return { form, isLoading, isSaving, error, setField, toggleSkill, save };
}
