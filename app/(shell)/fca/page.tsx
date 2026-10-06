import { FcaWorkspace } from "@/components/fca/FcaWorkspace";
import { PageHeader } from "@/components/ui/PageHeader";
import { FCA_COPY } from "@/lib/config/fca";

export const metadata = { title: "FCA" };

/** Montagem de FCA (Fato, Causa e Ação) a partir de chamado RAL/REC. */
export default function Page() {
  return (
    <>
      <PageHeader title="FCA" description={FCA_COPY.description} />
      <FcaWorkspace />
    </>
  );
}
