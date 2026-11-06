import { classifyDifRefTone, formatOpticalValue } from "@/lib/format/tx-optical";

type TxDifRefValueProps = {
  value: unknown;
  className?: string;
};

/** Valor de DIF colorido conforme faixa operacional (medido vs referência). */
export function TxDifRefValue({ value, className }: TxDifRefValueProps) {
  const tone = classifyDifRefTone(value);
  const classes = ["tx-dif-ref-value", `tx-dif-ref-value--${tone}`];
  if (className) classes.push(className);
  return <span className={classes.join(" ")}>{formatOpticalValue(value)}</span>;
}
