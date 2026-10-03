# NSBM Pathway Recommender

Before building or changing any UI, read `design-system/README.md` and `design-system/pages.md`, and follow them.

- Styles: import `design-system/tokens.css` (CSS variables for light and dark) and `design-system/components/bundle.css`. Use the tokens; never hard-code colours, spacing or radii.
- Theme: set `data-theme="light"` or `data-theme="dark"` on `<html>`; persist the choice in `localStorage("theme")`.
- Components: `design-system/components/bundle.js` is a React 18 reference implementation (`window.NsbmPathway`). Props are in `components/index.d.ts`; usage rules are in each `components/<Name>/README.md`. When porting to `.tsx`, keep the same `np-` class names and tokens.
- The design system's source of truth is the Design System artifact on claude.ai (https://claude.ai/artifact/15vHRtXufgrW1r5MVZg2Mh). If it changes, re-copy these files.
