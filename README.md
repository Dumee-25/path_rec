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

The camera, upload checks, prompts, endpoints and screens are all built. It is switched off until an
image model is connected, and the page then shows "Career visualization is not available yet".
Connecting a model is a one-time job in `backend/services/providers/`:

1. Add a module there with a class that has `name`, `configured = True` and one method:

   ```python
   def generate(self, *, photo: bytes, mime_type: str, prompt: str) -> GeneratedImage:
       ...  # send the photo and prompt to your image-editing model
       return GeneratedImage(data=image_bytes, mime_type="image/png")
   ```

2. Register it in `PROVIDERS` in `services/providers/__init__.py`. If a setting such as the API key
   is missing, raise `ProviderConfigError` from its factory so the server will not start half set up.
3. Copy `backend/.env.example` to `backend/.env` and set `IMAGE_PROVIDER` (and `IMAGE_API_KEY`,
   `IMAGE_MODEL` if the provider needs them).

To try the whole flow without a model, set `IMAGE_PROVIDER=mock`. It returns the photo unchanged and
the page labels it as a development preview. Do not use it for real visitors.

The photo is held in memory for one request. It is never written to disk, logged or used for
scoring, and it is uploaded only when the person chooses Generate Visualization.

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
- **Enable Camera** is a button label from the specification. The design system lists only
  Capture Photo, Retake Photo and Generate Visualization.

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
  utils/scoring.py        Pure scoring functions
  tests/
frontend/
  src/components/         Design system components and the career visualization section
  src/pages/              Home, Questionnaire, Results
  src/services/api.ts     API client
  public/                 Logo and landing photo
design-system/            Copy of the Design System artifact (do not edit here)
assets/photos/            Original, uncropped photographs
```
