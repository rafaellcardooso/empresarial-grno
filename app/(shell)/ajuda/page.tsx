import { TutorialPage } from "@/components/tutorial/TutorialPage";
import { TUTORIAL_COPY } from "@/lib/config/tutorial-copy";

export const metadata = { title: TUTORIAL_COPY.title };

/** Página autenticada com o tutorial de tratativa SIR / BSOD / SDH. */
export default function Page() {
  return <TutorialPage />;
}
