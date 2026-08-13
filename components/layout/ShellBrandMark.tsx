type ShellBrandMarkProps = {
  suffix: string;
};

/** Marca GRNO + sufixo do produto (chip da navbar). */
export function ShellBrandMark({ suffix }: ShellBrandMarkProps) {
  return (
    <span className="shell-brand-mark">
      <span className="shell-brand-mark__grno">
        GR<span className="shell-brand-mark__no">NO</span>
      </span>{" "}
      <span className="shell-brand-mark__suffix">{suffix}</span>
    </span>
  );
}
