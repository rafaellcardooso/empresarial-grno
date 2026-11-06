import { TutorialStep } from "@/components/tutorial/TutorialStep";
import { PageHeader } from "@/components/ui/PageHeader";
import { TUTORIAL_COPY } from "@/lib/config/tutorial-copy";
import { TUTORIAL_SHOTS } from "@/lib/config/tutorial-shots";

const ANCHORS = [
  { id: "visao-geral", label: TUTORIAL_COPY.navOverview },
  { id: "sir", label: TUTORIAL_COPY.navSir },
  { id: "bsod", label: TUTORIAL_COPY.navBsod },
  { id: "sdh", label: TUTORIAL_COPY.navSdh },
] as const;

/** Página de tutorial de tratativa com seções e prints. */
export function TutorialPage() {
  return (
    <>
      <PageHeader title={TUTORIAL_COPY.title} description={TUTORIAL_COPY.lead} />

      <nav className="tutorial-toc" aria-label="Seções do tutorial">
        <ul className="tutorial-toc__list">
          {ANCHORS.map((item) => (
            <li key={item.id}>
              <a className="tutorial-toc__link" href={`#${item.id}`}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section className="tutorial-section" id="visao-geral">
        <h2 className="tutorial-section__title">{TUTORIAL_COPY.overviewTitle}</h2>
        <p className="tutorial-section__lead">{TUTORIAL_COPY.overviewLead}</p>
        <h3 className="tutorial-section__subtitle">{TUTORIAL_COPY.overviewStepsTitle}</h3>
        <div className="tutorial-section__steps">
          <TutorialStep
            step={1}
            title={TUTORIAL_COPY.overviewStep1Title}
            body={TUTORIAL_COPY.overviewStep1Body}
            shot={TUTORIAL_SHOTS.overviewList}
          />
          <TutorialStep
            step={2}
            title={TUTORIAL_COPY.overviewStep2Title}
            body={TUTORIAL_COPY.overviewStep2Body}
          />
          <TutorialStep
            step={3}
            title={TUTORIAL_COPY.overviewStep3Title}
            body={TUTORIAL_COPY.overviewStep3Body}
          />
          <TutorialStep
            step={4}
            title={TUTORIAL_COPY.overviewStep4Title}
            body={TUTORIAL_COPY.overviewStep4Body}
          />
        </div>
      </section>

      <section className="tutorial-section" id="sir">
        <h2 className="tutorial-section__title">{TUTORIAL_COPY.sirTitle}</h2>
        <p className="tutorial-section__lead">{TUTORIAL_COPY.sirLead}</p>
        <div className="tutorial-section__steps">
          <TutorialStep
            step={1}
            title={TUTORIAL_COPY.sirStep1Title}
            body={TUTORIAL_COPY.sirStep1Body}
            shot={TUTORIAL_SHOTS.sirLista}
          />
          <TutorialStep
            step={2}
            title={TUTORIAL_COPY.sirStep2Title}
            body={TUTORIAL_COPY.sirStep2Body}
            shot={TUTORIAL_SHOTS.sirPainel}
          />
          <TutorialStep
            step={3}
            title={TUTORIAL_COPY.sirStep3Title}
            body={TUTORIAL_COPY.sirStep3Body}
            shot={TUTORIAL_SHOTS.sirAcionamento}
          />
          <TutorialStep
            step={4}
            title={TUTORIAL_COPY.sirStep4Title}
            body={TUTORIAL_COPY.sirStep4Body}
            shot={TUTORIAL_SHOTS.sirConcluir}
          />
        </div>
      </section>

      <section className="tutorial-section" id="bsod">
        <h2 className="tutorial-section__title">{TUTORIAL_COPY.bsodTitle}</h2>
        <p className="tutorial-section__lead">{TUTORIAL_COPY.bsodLead}</p>
        <div className="tutorial-section__steps">
          <TutorialStep
            step={1}
            title={TUTORIAL_COPY.bsodStep1Title}
            body={TUTORIAL_COPY.bsodStep1Body}
            shot={TUTORIAL_SHOTS.bsodLista}
          />
          <TutorialStep
            step={2}
            title={TUTORIAL_COPY.bsodStep2Title}
            body={TUTORIAL_COPY.bsodStep2Body}
            shot={TUTORIAL_SHOTS.bsodAcionamento}
          />
          <TutorialStep
            step={3}
            title={TUTORIAL_COPY.bsodStep3Title}
            body={TUTORIAL_COPY.bsodStep3Body}
            shot={TUTORIAL_SHOTS.bsodValidacao}
          />
          <TutorialStep
            step={4}
            title={TUTORIAL_COPY.bsodStep4Title}
            body={TUTORIAL_COPY.bsodStep4Body}
            shot={TUTORIAL_SHOTS.bsodConcluir}
          />
        </div>
      </section>

      <section className="tutorial-section" id="sdh">
        <h2 className="tutorial-section__title">{TUTORIAL_COPY.sdhTitle}</h2>
        <p className="tutorial-section__lead">{TUTORIAL_COPY.sdhLead}</p>
        <div className="tutorial-section__steps">
          <TutorialStep
            step={1}
            title={TUTORIAL_COPY.sdhStep1Title}
            body={TUTORIAL_COPY.sdhStep1Body}
            shot={TUTORIAL_SHOTS.sdhLista}
          />
          <TutorialStep
            step={2}
            title={TUTORIAL_COPY.sdhStep2Title}
            body={TUTORIAL_COPY.sdhStep2Body}
            shot={TUTORIAL_SHOTS.sdhAcionamento}
          />
          <TutorialStep
            step={3}
            title={TUTORIAL_COPY.sdhStep3Title}
            body={TUTORIAL_COPY.sdhStep3Body}
            shot={TUTORIAL_SHOTS.sdhPainel}
          />
          <TutorialStep
            step={4}
            title={TUTORIAL_COPY.sdhStep4Title}
            body={TUTORIAL_COPY.sdhStep4Body}
            shot={TUTORIAL_SHOTS.sdhConcluir}
          />
        </div>
      </section>
    </>
  );
}
