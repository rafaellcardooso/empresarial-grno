type TratativaOperatorStackProps = {
  name?: string | null;
  corporateId?: string | null;
};

/** Exibe o responsável pela tratativa (nome + login), separado da fase do workflow. */
export function TratativaOperatorStack({ name, corporateId }: TratativaOperatorStackProps) {
  const displayName = name?.trim() || null;
  const login = corporateId?.trim() || null;
  if (!displayName && !login) return null;

  const who = [displayName, login].filter(Boolean).join(" · ");

  return (
    <div className="tratativa-operator-stack" title={who}>
      <span className="tratativa-operator-stack__caption">Responsável</span>
      {displayName ? <span className="tratativa-operator-stack__name">{displayName}</span> : null}
      {login ? <span className="tratativa-operator-stack__login">{login}</span> : null}
    </div>
  );
}
