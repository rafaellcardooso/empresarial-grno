import Image from "next/image";
import { withBasePath } from "@/lib/config/base-path";
import type { TutorialShot } from "@/lib/config/tutorial-shots";

type TutorialStepProps = {
  step: number;
  title: string;
  body: string;
  shot?: TutorialShot;
};

/** Passo numerado do tutorial com texto e print opcional. */
export function TutorialStep({ step, title, body, shot }: TutorialStepProps) {
  return (
    <article className="tutorial-step">
      <div className="tutorial-step__text">
        <span className="tutorial-step__num" aria-hidden="true">
          {step}
        </span>
        <div>
          <h3 className="tutorial-step__title">{title}</h3>
          <p className="tutorial-step__body">{body}</p>
        </div>
      </div>
      {shot ? (
        <figure className="tutorial-step__figure">
          <Image
            src={withBasePath(shot.src)}
            alt={shot.alt}
            width={1280}
            height={720}
            className="tutorial-step__img"
            unoptimized
          />
          <figcaption className="tutorial-step__caption">{shot.caption}</figcaption>
        </figure>
      ) : null}
    </article>
  );
}
