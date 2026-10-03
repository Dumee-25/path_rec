# AnswerOption

A large clickable row for one answer: 56px minimum, `surface`, 1px `border`, `radius-md`, with a native radio inside for keyboard and screen readers.

Render the options for one question with the same `name`, `space-3` apart, inside an element with `role="radiogroup"` and the question as its label. Provide `value`, `label`, `selected` and `onSelect`.

Selected uses `surface-selected`, `border-strong` and a filled green marker. Never outline the selected row in bright green. Hover shifts to `surface-subtle` and lifts 1px; no opacity fades.
