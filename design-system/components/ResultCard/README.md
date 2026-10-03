# ResultCard

A pathway result. The primary card holds the strongest match: large pathway name, a one-to-two sentence explanation in `text-secondary`, and a green `MatchScore`; it carries `shadow-soft` and splits into two columns from 1024px.

Secondary cards list Other Matches with a blue small score. They should look like good options, never like failures. No ranks, medals or coloured card borders; the border stays neutral `border` with `radius-lg`.

Provide `pathway`, `score` and `explanation`; put "Your Strongest Match" and "Other Matches" as section headings outside the card.
