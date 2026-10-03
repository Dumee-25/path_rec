# NSBM Pathway Recommender

An admissions tool for the NSBM Faculty of Computing. A student answers five short questions and
sees the computing pathways that suit them, with the degree programmes available under each. An
optional career visualization turns a photo into a career-themed portrait.

It is rule-based: no database, no accounts, no machine learning. The scoring rules, degrees,
explanations and image prompts all live in JSON files that can be edited without touching code.
The full specification is in `faculty_pathway_recommendation_system_spec.md`.

## Running it

You need Python 3.12+ with [uv](https://docs.astral.sh/uv/), and Node 22.12 or newer.

**Development** (two terminals):

```bash
cd backend
uv sync
uv run uvicorn main:create_app --factory --reload
```

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server forwards `/api` to the backend on port 8000.

**Production** (one process, one address). Build the frontend once, then let the backend serve it:

```bash
cd frontend
npm install
npm run build

cd ../backend
uv sync
uv run uvicorn main:create_app --factory --host 0.0.0.0 --port 8000
```

Open http://localhost:8000. The browser only allows camera access on `localhost` or over HTTPS, so
anyone using the camera from another computer needs the site served over HTTPS.

## Checks

```bash
cd backend && uv run ruff check . && uv run mypy && uv run pytest
cd frontend && npm run typecheck && npm test
```

The backend suite includes every one of the 27,216 possible answer combinations. Both suites
run without a network connection or an image provider.

## Changing the content

Everything below is in `backend/data/`. The server checks the files against each other when it
starts and refuses to run if they disagree, for example a weight that names a pathway that does
not exist, or a pathway with no degree.

| File | What it holds |
|---|---|
| `questions.json` | The five questions, their options, and the pathway weights for each option |
| `degrees.json` | Degree programmes, their university and country, and the pathway each belongs to |
| `pathways.json` | The nine pathways, their one-line description and career title. The order is the tie-break order |
| `explanations.json` | The "Why this matched" lines for each pathway |
| `scoring.json` | Top-N, score normalization, the match labels, and how strong an answer must be to justify an explanation line |
| `career_prompts.json` | The base image prompt, the safety constraints, and one scene per pathway |

How the result is worked out:

- Each chosen answer adds its weights to the pathways. The top three pathways are shown.
- Ties go to the pathway with more +3 answers, then to the order in `pathways.json`.
- The display score is relative to the applicant's best pathway, so the top match is always 100.
  Set `"normalization": "max_possible"` in `scoring.json` to score against each pathway's maximum instead.
- Pathways with a score of zero are not shown, so some answer patterns give two matches, not three.
- An explanation line is used only when at least one answer behind it weighted the pathway by
  `min_reason_weight` or more, so a weak match never claims a strong interest.

## Career visualization

Optional, and separate from the recommendation. The person takes a photo with the camera or uploads
one from a file, then chooses Generate Visualization. The model used is **FLUX.1 Kontext [dev]**
(`black-forest-labs/FLUX.1-Kontext-dev`), an image-editing model, reached through Hugging Face
Inference Providers.

### Switching it on

1. Copy `backend/.env.example` to `backend/.env`.
2. Put a Hugging Face access token in `IMAGE_API_KEY` (it starts with `hf_` and must be allowed to
   call Inference Providers). Create one at https://huggingface.co/settings/tokens.
3. Start, or restart, the backend. Without a key the server refuses to start and says why.

Until then the page says "Career visualization is not available yet" and everything else works.

| Setting in `backend/.env` | Meaning |
|---|---|
| `IMAGE_PROVIDER` | `flux_kontext_dev` to use the model, `none` to switch the feature off, `mock` to try the flow without a model |
| `IMAGE_API_KEY` | Hugging Face access token (required for `flux_kontext_dev`) |
| `IMAGE_MODEL` | Optional. Defaults to `black-forest-labs/FLUX.1-Kontext-dev` |
| `IMAGE_INFERENCE_PROVIDER` | Optional. `auto` (default), `fal-ai`, `replicate` or `wavespeed` |
| `IMAGE_TIMEOUT_SECONDS` | Optional. How long to wait for an image. Default 120 |

### Checking it works

Before opening the browser, try one photo from the command line. It uses the same settings and the
same code path as the app, and saves the result:

```bash
cd backend
uv run python -m scripts.try_career_image path/to/photo.jpg "Data Science"
```

Add `--show-prompt` to print the exact prompt that is sent. Failures are explained in the output and
in the server log, for example:

| What you see | Likely cause |
|---|---|
| HTTP 401 or 403 in the log | The token is wrong, lacks Inference Providers permission, or its account has not accepted the model's terms on huggingface.co |
| HTTP 402 | The account is out of credits |
| "The image service is busy" (429 or 503) | The provider is rate limiting; try again shortly |
| "taking longer than expected" (504) | No image within `IMAGE_TIMEOUT_SECONDS`. A job that was given up on may still finish at the provider and be billed |

### What has and has not been verified

The provider is covered by automated tests that run the real Hugging Face client against a faked
fal-ai network: the request carries the prompt, the photo and the token, the queue is polled, and the
result is downloaded and converted. It has **not** been run against the live service, because no key
was available when it was written. The first real call, ideally with the command above, is the
acceptance test.

Facts worth knowing, checked against huggingface.co on 3 October 2026:

- The model is listed as `image-to-image` and served by fal-ai, replicate and wavespeed. `auto` follows
  your Hugging Face provider preferences; set `IMAGE_INFERENCE_PROVIDER` to pin one.
- An `hf_` token is routed through Hugging Face and billed there. A provider's own key also works if
  `IMAGE_INFERENCE_PROVIDER` names that provider.
- FLUX.1 Kontext [dev] is released by Black Forest Labs under a non-commercial licence. Confirm that
  NSBM's use is covered before relying on it.

### Privacy

The photo is held in memory for one request, and it is never written to disk, logged or used for
scoring. It is uploaded only when the person chooses Generate Visualization. Before it reaches the
model it is re-encoded as a JPEG of at most 1024 pixels, which removes any location data stored in
the file. The browser does the same shrinking first, so a large phone photo is not sent in full.

### Using a different model

`flux_kontext_dev` is one provider among several the app can load. To connect another model, add a
module in `backend/services/providers/` with a class that has `name`, `configured = True` and a
`generate(self, *, photo, mime_type, prompt)` method returning a `GeneratedImage`, then register it in
`PROVIDERS` in `services/providers/__init__.py`. Nothing else changes.

## Design system

The interface follows `design-system/`: tokens, the `np-` components and the page structures. The
components in `frontend/src/components/` are TypeScript ports of `design-system/components/bundle.js`
with the same class names. If the Design System artifact changes, re-copy its files.

These are the places where the app goes beyond or differs from the design system, on purpose:

- **Faculty name in the header** is set in Roboto Slab Bold in brand blue, matching the official
  Faculty of Computing site (`--font-faculty` in `frontend/src/styles/app.css`). The design system
  would otherwise use Manrope.
- **Landing-page photograph.** The design system says no stock hero photo. This is a real NSBM Media
  photo, shown flat with its credit as text beneath it. See `assets/photos/README.md`. Set
  `LANDING_PHOTO` to `null` in `frontend/src/config.ts` to remove it.
- **Logo.** `frontend/public/logo/nsbm-green-university.png` is the supplied logo with its empty
  transparent margins trimmed and no artwork changed. The untouched original is in
  `design-system/assets/Logos/`. At the specified 150 px width the logo is 67.5 px tall, so the
  header uses 72 px, the top of the 64 to 72 px range. In dark mode the logo sits on a light panel
  (`--logo-panel`), as the design system's Logo section describes.
- **Extra styles.** The "Why this matched" list, the compact degree lists inside the Other Matches
  cards, and the page layout are in `frontend/src/styles/app.css` and use tokens only.
- **Enable Camera** and **Upload Photo** are button labels the design system does not list. It names
  only Capture Photo, Retake Photo and Generate Visualization.
- **Landing-page sections.** `design-system/pages.md` describes the landing page as the headline, a
  line of text and a button. How It Works and Pathways You Can Explore go further. They are flat,
  text-only and use tokens and the `DegreeCard` component, with no icons or gradients. The pathway
  list is built from the live pathway data and hides quietly if the server cannot be reached.
- **Footer.** The design system has no footer, so this is a plain one built from tokens: the faculty
  and university names, the address, the new student enquiries email and phone, a link to the faculty
  website, and "All rights reserved". The details are NSBM's own, as published on nsbm.ac.lk and its
  Faculty of Computing page. They live in `FOOTER` in `frontend/src/config.ts`, so they can be
  corrected in one place. The year updates itself.

## Notes on the specification

- The worked example in section 20 prints Data Science 6/40 and Computer Science 4/27 for answers
  C, D, C, D, D. Working the weights through gives 5/33 and 2/13, and the app and its tests use those.
- Degrees appear under all three recommended pathways, as sections 4, 16 and 24 describe.

## Layout

```
backend/
  main.py                 FastAPI app and routes
  config.py               Settings (environment variables, backend/.env)
  models.py, schemas.py   Domain models and API bodies
  data/                   All editable content (see above)
  services/               Catalogue loading, recommendations, career image, providers
  utils/                  Pure scoring functions, and photo preparation
  scripts/                try_career_image.py: command-line check of the career visualization
  tests/
frontend/
  src/components/         Design system components and the career visualization section
  src/pages/              Home, Questionnaire, Results
  src/services/api.ts     API client
  public/                 Logo and landing photo
design-system/            Copy of the Design System artifact (do not edit here)
assets/photos/            Original, uncropped photographs
```
