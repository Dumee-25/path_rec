import { useNavigate } from "react-router-dom";
import { Button } from "../components";
import { LANDING_PHOTO, QUESTION_COUNT_COPY } from "../config";
import { usePathways } from "../hooks/usePathways";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useAnswers } from "../state/answers";
import { HowItWorks, PathwayList } from "./LandingSections";

export function Home() {
  const navigate = useNavigate();
  const { reset } = useAnswers();
  const pathways = usePathways();
  useDocumentTitle("Find Your Computing Path");

  function start() {
    reset();
    navigate("/questions/1");
  }

  return (
    <>
      <div className="app-page app-landing">
        <div className="app-intro">
          <p className="small app-eyebrow">Faculty of Computing</p>
          <h1 className="hero">Find Your Computing Path</h1>
          <p className="body-lg app-lead">
            Answer five short questions to discover the computing pathways that best match your interests.
          </p>
          <Button onClick={start}>Start Recommendation</Button>
          <p className="meta app-note">{QUESTION_COUNT_COPY} · About 1 minute</p>
        </div>
        {LANDING_PHOTO ? (
          <figure className="app-landing-photo">
            <div className="app-landing-photo-frame">
              <img
                src={LANDING_PHOTO.src}
                width={LANDING_PHOTO.width}
                height={LANDING_PHOTO.height}
                alt={LANDING_PHOTO.alt}
                decoding="async"
              />
            </div>
            <figcaption className="app-photo-credit">
              <span className="small">{LANDING_PHOTO.photographer}</span>
              <span className="meta">{LANDING_PHOTO.rights}</span>
            </figcaption>
          </figure>
        ) : null}
      </div>

      <HowItWorks />
      {pathways ? <PathwayList pathways={pathways} /> : null}
    </>
  );
}
