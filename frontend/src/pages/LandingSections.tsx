import { DegreeCard } from "../components";
import type { Pathway } from "../types";

const STEPS = [
  {
    title: "Answer five questions",
    text: "Pick the option that appeals to you most in each question. There are no right or wrong answers.",
  },
  {
    title: "See your top pathways",
    text: "Your answers are compared with every computing pathway. You see your closest matches, each with a score out of 100.",
  },
  {
    title: "Explore degree programmes",
    text: "Each pathway lists the degree programmes you can study, and the university that offers each one.",
  },
];

export function HowItWorks() {
  return (
    <section className="app-band app-landing-band" aria-labelledby="steps-title">
      <div className="app-page app-landing-section">
        <h2 id="steps-title" className="section-title app-section-title">
          How It Works
        </h2>
        <p className="body-lg app-lead app-section-lead">It takes about a minute.</p>
        <ol className="app-steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="app-step">
              <span className="app-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="card-title app-step-title">{step.title}</h3>
              <p className="app-step-text">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function PathwayList({ pathways }: { pathways: Pathway[] }) {
  return (
    <section className="app-page app-landing-section" aria-labelledby="pathways-title">
      <h2 id="pathways-title" className="section-title app-section-title">
        Pathways You Can Explore
      </h2>
      <p className="body-lg app-lead app-section-lead">
        These are the pathways your answers are matched against. A result is a guide to what fits your interests, not a
        prediction of how you will do.
      </p>
      <ul className="app-pathway-grid">
        {pathways.map((pathway) => (
          <li key={pathway.id}>
            <DegreeCard title={pathway.name}>
              <p className="app-pathway-text">{pathway.description}</p>
              <p className="app-pathway-career">Career focus: {pathway.career}</p>
            </DegreeCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
