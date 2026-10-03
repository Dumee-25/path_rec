# Page structures

The app has three screens and one optional section. Navigation stays minimal: `Header` with the logo, "Faculty of Computing" and the theme toggle. Home and About This Tool are the only optional links. Never recreate the full NSBM corporate menu.

## Landing

```text
Header
Faculty of Computing              (small, text-secondary)
Find Your Computing Path          (hero)
Answer five short questions...    (body-lg, text-secondary)
[ Start Recommendation ]          (Button primary)
5 questions · About 1 minute      (meta, text-muted)
```

Left-align or centre the block inside `content-max`. No badge above the headline and no stock photo.

## Questionnaire

```text
Header
Question 2 of 5                   (QuestionProgress)
Question                          (question style)
AnswerOption × n                  (space-3 apart)
Back        Continue              (Button secondary, Button primary)
```

One question per screen, centred at `question-max`. Continue stays disabled until an answer is chosen. On mobile the Continue bar may stick to the bottom.

## Results

```text
Header
Your Strongest Match              (section-title)
ResultCard primary                (pathway, MatchScore green, why it matches)
Available Degree Programmes       (section-title, DegreeCard grid)
Other Matches                     (ResultCard secondary × n, MatchScore blue)
See Yourself in This Career       (career visualization)
```

Show "Calculating your matches..." in `LoadingState` while results compute.

## Career visualization

Heading "See Yourself in This Career", then "Take a photo and generate a career-themed visualization related to your recommended pathway." On desktop two `MediaFrame`s sit side by side: Your Photo, then Career Visualization, with Capture Photo / Retake Photo and Generate Visualization under each. Stack them on mobile.

Show this `Notice` above the frames, before asking for camera permission: "Your photo is used only to generate the career visualization and does not affect your pathway recommendation." Keep the section visually separate from the results so the photo never looks like an input to the recommendation.
