The pathway recommender is an NSBM Faculty of Computing admissions tool: a student answers five short questions and gets the computing pathways and degree programmes that suit them. It should read as an official NSBM product built as a focused digital tool. It should never read as an AI startup template with NSBM colours pasted on. Every screen is academic, calm, clear and quick to use.

Priorities, in order: NSBM brand recognition, readability, clear hierarchy, fast interaction, strong light and dark modes, consistent spacing, functional feedback, minimal visual noise, a professional academic tone, and clear results.

## Content fundamentals

Write plain, useful, believable copy. Title Case for page titles and button labels, as the guidelines do ("Start Recommendation", "Your Strongest Match"). Address the student as "you". No emoji, no exclamation marks, no buzzwords, few em dashes.

Use these labels as written: Start Recommendation, Continue, Back, Your Strongest Match, Available Degree Programmes, Other Matches, Capture Photo, Retake Photo, Generate Visualization.

Hero title: "Find Your Computing Path". Supporting line: "Answer five short questions to discover the computing pathways that best match your interests." Under the button: "5 questions · About 1 minute".

Never write "Unlock your limitless potential", "AI-powered future discovery", "Revolutionize your academic journey", "Transform your career with intelligence" or "Discover the future of tomorrow".

Loading copy is a plain status line: "Calculating your matches..." and "Creating your career visualization...". No fake typing effects or chat bubbles.

Results inform; they do not rank people. No gold, silver or bronze, and secondary pathways must never look like failures.

## Colour

The four NSBM colours define the identity but carry unequal weight. Keep the interface mostly neutral so the brand colours stay meaningful.

- `brand-blue`: navigation, headings, structural emphasis, secondary score bars.
- `brand-green`: primary actions, selected markers, progress, the primary score bar.
- `brand-lime`: small highlights only.
- `brand-cyan`: secondary accents and data visualisation.
- Neutrals (`bg`, `surface`, `surface-subtle`, `border`, `text-*`) do everything else.

Set the page on `bg` and cards on `surface`; do not paint every area pure white. Body text is `text-primary`, supporting text `text-secondary`. Keep `text-muted` for metadata; never use it for instructions or answer choices.

Label every green fill with `on-green` (dark ink). The original guideline used white, which reads 2.7:1 in light and 2.3:1 in dark and fails the AA requirement below. Do not set text in `brand-green`, `brand-cyan` or `brand-lime` on light surfaces.

Dark mode is its own theme, set with `[data-theme="dark"]` on `<html>`. Deep blue-black neutrals keep it tied to NSBM; never pure black, no glow, no neon. Brand colours are a step brighter there. In dark, `brand-blue` reads only 3.6 to 4.5:1 as text, so use it for bars and large headings, not small text.

Known gaps kept from the source: `text-muted` in light (3.6 to 3.9:1) and `warning` in light (3.4 to 3.8:1) miss AA for small text. Use them at 18px+ or for non-essential metadata. The progress and score fills in light green sit near 2.4:1 against their track, so the "Question 3 of 5" label and the printed score always accompany them.

## Typography

Headings, pathway names and scores use Manrope (`--font-display`). Everything else, including questions, answers, buttons, labels and degree details, uses Source Sans 3 (`--font-body`). Both load from Google Fonts. Never default to Inter, and never pair Space Grotesk with Instrument Serif.

Use the type styles: `hero` 48px (40 tablet, 32 mobile), `result-title` 40px (32 mobile), `score` 56px (44 mobile), `section-title` 28px, `card-title` 20px, `question` 24px (20 mobile), `body-lg` 18px, `body` 16px, `label` 16px semibold, `small` 14px, `meta` 12px. Weights are 400, 500, 600 and 700; keep bold selective and never set large areas ultra-bold. Do not enlarge text for spectacle. No serif italic accents and no gradient text.

## Spacing and layout

Use only the 4px scale `space-1` to `space-20`. Inside components use `space-3` to `space-6`; between sections use `space-12`, `space-16` or `space-20`. Never invent values.

Constrain content to `content-max` (1180px) centred, with `space-6` side padding on desktop and `space-4` on mobile. Centre the question panel at `question-max` (760px). Header height is `header-height` (64 to 72px).

Every page follows one rhythm: header, page title, supporting text, primary content, secondary content, primary action. See Page structures for the three screens.

Breakpoints: `bp-mobile` 480, `bp-tablet` 768, `bp-desktop` 1024, `bp-wide` 1280. Mobile is one column with full-width answer rows; a sticky bottom Continue button is allowed. Tablet keeps the questionnaire single-column. Desktop may split the primary result into two columns and set degree cards in a 2-column grid.

## Shape, borders and depth

Radii are `radius-sm` 6px, `radius-input` 8px, `radius-button` 9px, `radius-md` 10px (answer rows, degree cards) and `radius-lg` 14px (result cards). Never round past 14px, and avoid pills.

Borders are 1px `border`, neutral. Never outline a whole card in green, blue, cyan or lime. Brand colour may appear in a selected marker, a progress or score bar, text, a compact active marker, or a button.

`shadow-soft` is the only shadow; use it on the primary result card and raised layers. No glassmorphism, no floating cards.

## Interaction states

Answer rows: hover shifts to `surface-subtle` and lifts 1px. Selected rows use `surface-selected`, `border-strong` and a filled green marker; never a bright green outline.

Primary button: `brand-green` with `on-green` label; hover goes to `brand-green-hover` and lifts 1px. Secondary button: `surface` with `border-strong` and `text-primary`. Never fade buttons with opacity, and do not make every secondary action blue.

Focus: `outline: 3px solid var(--focus); outline-offset: 3px` on `:focus-visible` for every control. Minimum target height is `tap-min` (44px); answer rows are `answer-min` (56px).

## Motion

Motion is functional: press feedback, selection feedback, progress updates, small spinners, page changes under 150ms. Use `transition-fast` (120ms) and `transition-normal` (160ms). No fade-in-on-scroll, parallax, cursor-following effects, floating objects or long springs. Respect `prefers-reduced-motion` by removing animations and transitions.

## Logo

The official NSBM Green University logo is not stored in this system yet; add the supplied file to the Logos group. Until then, set "NSBM Green University" in plain type. Never draw or approximate the mark. Use the logo unaltered: no recolouring, stretching, cropping, glow, shadow, outline or filters; keep clear space; never over busy imagery. Width is `logo-width` (150px) on desktop and `logo-width-mobile` (120px) on mobile. In dark mode use an official reversed logo if one exists; otherwise place the original on a small solid light panel.

## Iconography

Use icons only where they help comprehension: theme toggle, camera, retry, back and similar actions. Keep one small, consistent set at 20px, stroked in the current text colour. Never put an icon beside every heading or field, never arrange decorative icon tiles in rows, and do not let Lucide become the product's identity.

## Imagery and decoration

No stock hero photo unless required. The hero relies on type, NSBM colours and whitespace. If you add background detail, use a few flat lines or simple network geometry at low opacity, static. No gradients anywhere, no blobs, no grain overlays, no neon.

## Accessibility

WCAG AA text contrast in both themes, visible focus, full keyboard use, 44px targets, labels tied to controls, no colour-only states, meaningful alt text, a clear explanation before the camera permission prompt, and a keyboard-operable theme toggle.

## Theme toggle

Offer Light, Dark and System. Start from `prefers-color-scheme`, persist the choice with `localStorage.setItem("theme", choice)`, and keep the toggle visible but quiet. No animated sun and moon. `NsbmPathway.applyTheme(choice)` does the persistence and sets `data-theme`.

## Components

Components live in `components/bundle.js` as `window.NsbmPathway` and need React 18 on the page; their styles are in `components/bundle.css` with `np-` class names. If you use a component library instead, strip its defaults and apply these tokens; never ship untouched shadcn.

## Never

Purple-to-blue gradients, gradient hero text, untouched shadcn, Inter everywhere, emoji in headings, a badge above the headline, coloured-border cards, glassmorphism, opacity-fade hovers, cursor beams, fade-in-on-scroll, serif italic accents, decorative icon rows, Lucide everywhere, grain over gradients, excess pills, neon, floating blobs, fake chat aesthetics, decorative dashboard widgets, random micro-animations, inconsistent spacing, low-contrast dark mode, buzzword copy.
