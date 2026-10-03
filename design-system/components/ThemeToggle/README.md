# ThemeToggle

A quiet three-way switch for Light, Dark and System, built as a keyboard-operable radio group (arrow keys move the choice).

It is controlled: provide `value` and `onChange`. Call `NsbmPathway.applyTheme(choice)` in `onChange` to persist to `localStorage("theme")` and set `data-theme` on `<html>`; read the starting value with `NsbmPathway.readTheme()`. System follows `prefers-color-scheme`.

Text labels only. No animated sun and moon.
