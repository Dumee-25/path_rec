# Faculty Pathway Recommendation System
## Implementation Specification

**Purpose:**  
Build a lightweight, rule-based recommendation system that suggests the most suitable **study pathways** for an applicant, then shows the degree programmes available under those pathways.

The system does **not** recommend a single degree directly. Instead, it:

1. Collects answers to **5 short questions**.
2. Scores the applicant against **9 study pathways**.
3. Returns the **Top 3 pathway matches**.
4. Shows all available degree programmes mapped to those pathways.
5. Optionally captures a live photo of the applicant and generates a **career-themed professional image** related to the selected pathway.

---

# 1. Supported Study Pathways

The system supports the following 9 pathways:

1. Computer Science
2. Data Science
3. Artificial Intelligence
4. Computer Security
5. Cyber Security
6. Software Engineering
7. Computer Networks
8. Technology Management
9. Management Information Systems

---

# 2. Degree Programme Catalogue

## 2.1 NSBM Green University

| Pathway | Degree Programme |
|---|---|
| Data Science | BSc (Hons) in Data Science |
| Computer Networks | BSc (Hons) in Computer Networks |
| Computer Science | BSc (Hons) in Computer Science |
| Software Engineering | BSc (Hons) in Software Engineering |
| Management Information Systems | BSc in Management Information Systems (Special) |

---

## 2.2 Plymouth University - United Kingdom

| Pathway | Degree Programme |
|---|---|
| Artificial Intelligence | BSc (Hons) Artificial Intelligence |
| Data Science | BSc (Hons) in Data Science |
| Technology Management | BSc (Hons) Technology Management |
| Computer Science | BSc (Hons) Computer Science |
| Computer Networks | BSc (Hons) Computer Networks |
| Computer Security | BSc (Hons) Computer Security |
| Software Engineering | BSc (Hons) Software Engineering |

---

## 2.3 Victoria University - Australia

| Pathway | Degree Programme |
|---|---|
| Cyber Security | Bachelor of Information Technology (Major in Cyber Security) |

---

# 3. Pathway-to-Degree Mapping

This mapping should be stored separately from the recommendation logic.

```json
{
  "Computer Science": [
    {
      "degree": "BSc (Hons) in Computer Science",
      "university": "NSBM Green University"
    },
    {
      "degree": "BSc (Hons) Computer Science",
      "university": "Plymouth University - United Kingdom"
    }
  ],

  "Data Science": [
    {
      "degree": "BSc (Hons) in Data Science",
      "university": "NSBM Green University"
    },
    {
      "degree": "BSc (Hons) in Data Science",
      "university": "Plymouth University - United Kingdom"
    }
  ],

  "Artificial Intelligence": [
    {
      "degree": "BSc (Hons) Artificial Intelligence",
      "university": "Plymouth University - United Kingdom"
    }
  ],

  "Computer Security": [
    {
      "degree": "BSc (Hons) Computer Security",
      "university": "Plymouth University - United Kingdom"
    }
  ],

  "Cyber Security": [
    {
      "degree": "Bachelor of Information Technology (Major in Cyber Security)",
      "university": "Victoria University - Australia"
    }
  ],

  "Software Engineering": [
    {
      "degree": "BSc (Hons) in Software Engineering",
      "university": "NSBM Green University"
    },
    {
      "degree": "BSc (Hons) Software Engineering",
      "university": "Plymouth University - United Kingdom"
    }
  ],

  "Computer Networks": [
    {
      "degree": "BSc (Hons) in Computer Networks",
      "university": "NSBM Green University"
    },
    {
      "degree": "BSc (Hons) Computer Networks",
      "university": "Plymouth University - United Kingdom"
    }
  ],

  "Technology Management": [
    {
      "degree": "BSc (Hons) Technology Management",
      "university": "Plymouth University - United Kingdom"
    }
  ],

  "Management Information Systems": [
    {
      "degree": "BSc in Management Information Systems (Special)",
      "university": "NSBM Green University"
    }
  ]
}
```

---

# 4. Recommendation Strategy

Because the system only uses **5 questions**, each question must provide strong information.

The recommendation engine should use:

- **Forced-choice answers**
- Weighted pathway scores
- Multiple pathway contributions from some answers
- Top 3 ranked pathway results

The system should **not** claim that the result is a scientific probability.

Recommended wording:

- `Pathway Match Score: 86/100`
- `Strongest Match`
- `Strong Match`
- `Related Match`

Avoid wording such as:

- `86% chance of success`
- `You are 86% suitable`
- `This guarantees that this degree is right for you`

---

# 5. Questionnaire

## Question 1 — Preferred Activity

**Which type of activity sounds most interesting to you?**

| Option | Answer | Pathway Weights |
|---|---|---|
| A | Building software applications | Software Engineering +3, Computer Science +2 |
| B | Working with data and discovering patterns | Data Science +3, Artificial Intelligence +1 |
| C | Creating intelligent or automated systems | Artificial Intelligence +3, Computer Science +1, Data Science +1 |
| D | Protecting systems from attacks and vulnerabilities | Computer Security +3, Cyber Security +2 |
| E | Designing and maintaining computer networks | Computer Networks +3, Cyber Security +1 |
| F | Managing technology within an organization | Technology Management +3, Management Information Systems +2 |

---

## Question 2 — Problem-Solving Preference

**When faced with a technical problem, which approach appeals to you most?**

| Option | Answer | Pathway Weights |
|---|---|---|
| A | Understand the underlying computing concepts and algorithms | Computer Science +3, Artificial Intelligence +1 |
| B | Design and build a reliable software solution | Software Engineering +3, Computer Science +1 |
| C | Analyse data to discover the answer | Data Science +3, Artificial Intelligence +1 |
| D | Train or design a system that can make predictions or decisions | Artificial Intelligence +3, Data Science +2 |
| E | Investigate how the system could be attacked or compromised | Computer Security +3, Cyber Security +2 |
| F | Examine how devices, networks and systems communicate | Computer Networks +3, Cyber Security +1 |
| G | Consider how technology can best support business goals | Management Information Systems +3, Technology Management +2 |

---

## Question 3 — Preferred Work Environment

**Which work environment sounds most appealing to you?**

| Option | Answer | Pathway Weights |
|---|---|---|
| A | Developing large software products with a development team | Software Engineering +3, Computer Science +1 |
| B | Working with datasets, dashboards, statistics and analytical models | Data Science +3, Management Information Systems +1 |
| C | Building AI-powered applications or intelligent systems | Artificial Intelligence +3, Computer Science +1 |
| D | Testing systems for vulnerabilities and improving their security | Computer Security +3, Cyber Security +2 |
| E | Monitoring cyber threats and responding to security incidents | Cyber Security +3, Computer Security +2 |
| F | Configuring network infrastructure, servers and connectivity | Computer Networks +3, Cyber Security +1 |
| G | Coordinating technology projects, teams and resources | Technology Management +3, Management Information Systems +1 |
| H | Improving business processes using information systems | Management Information Systems +3, Technology Management +2 |

---

## Question 4 — Preferred Subject Area

**Which subject area would you most enjoy learning deeply?**

| Option | Answer | Pathway Weights |
|---|---|---|
| A | Algorithms, programming and computing theory | Computer Science +3, Artificial Intelligence +1 |
| B | Software architecture, testing and development practices | Software Engineering +3, Computer Science +1 |
| C | Statistics, data analysis and machine learning | Data Science +3, Artificial Intelligence +2 |
| D | Artificial intelligence and intelligent systems | Artificial Intelligence +3, Data Science +1 |
| E | Operating-system, application and computer security | Computer Security +3, Cyber Security +1 |
| F | Cyber threats, digital forensics and incident response | Cyber Security +3, Computer Security +2 |
| G | Networking, cloud infrastructure and communication systems | Computer Networks +3, Cyber Security +1 |
| H | Business strategy, management and technology | Technology Management +3, Management Information Systems +2 |
| I | Business information systems and organizational processes | Management Information Systems +3, Technology Management +2 |

---

## Question 5 — Preferred Project Outcome

**Which outcome would make you feel most satisfied after completing a project?**

| Option | Answer | Pathway Weights |
|---|---|---|
| A | Solving a difficult computational problem | Computer Science +3, Artificial Intelligence +1 |
| B | Seeing people successfully use software I built | Software Engineering +3, Computer Science +1 |
| C | Discovering a useful insight hidden in data | Data Science +3, Artificial Intelligence +1 |
| D | Seeing a system learn or perform a task intelligently | Artificial Intelligence +3, Data Science +1 |
| E | Finding and fixing a serious security weakness | Computer Security +3, Cyber Security +2 |
| F | Successfully defending against or investigating a cyberattack | Cyber Security +3, Computer Security +2 |
| G | Getting a complex network or infrastructure working reliably | Computer Networks +3, Cyber Security +1 |
| H | Successfully leading a technology project | Technology Management +3, Management Information Systems +1 |
| I | Improving how an organization operates using technology | Management Information Systems +3, Technology Management +2 |

---

# 6. Scoring Logic

Each applicant starts with a score of `0` for every pathway.

```python
scores = {
    "Computer Science": 0,
    "Data Science": 0,
    "Artificial Intelligence": 0,
    "Computer Security": 0,
    "Cyber Security": 0,
    "Software Engineering": 0,
    "Computer Networks": 0,
    "Technology Management": 0,
    "Management Information Systems": 0
}
```

For each selected answer:

1. Read its pathway weight mapping.
2. Add those values to the applicant's current pathway scores.
3. After all 5 questions, rank pathways from highest to lowest.
4. Return the top 3.

Example:

```python
scores["Computer Security"] += 3
scores["Cyber Security"] += 2
```

---

# 7. Score Normalization

Because not every pathway appears with the same weight in every answer, the raw score should be converted to a display score.

A simple MVP approach:

```python
display_score = round((raw_score / max_possible_score_for_pathway) * 100)
```

Alternatively, for a simpler implementation, calculate scores relative to the best score obtained by the applicant:

```python
display_score = round((raw_score / highest_raw_score) * 100)
```

Example result:

```json
[
  {
    "pathway": "Artificial Intelligence",
    "score": 100,
    "label": "Strongest Match"
  },
  {
    "pathway": "Data Science",
    "score": 82,
    "label": "Strong Match"
  },
  {
    "pathway": "Computer Science",
    "score": 71,
    "label": "Related Match"
  }
]
```

For this prototype, relative normalization is acceptable and easy to explain.

---

# 8. Tie-Breaking Rules

If two pathways receive the same raw score:

1. Count how many answers gave the pathway a **primary weight of +3**.
2. The pathway with more primary matches ranks higher.
3. If still tied, preserve a consistent predefined order.

Recommended predefined order:

```text
Computer Science
Data Science
Artificial Intelligence
Computer Security
Cyber Security
Software Engineering
Computer Networks
Technology Management
Management Information Systems
```

The order is only for deterministic tie handling and does **not** imply that one pathway is better than another.

---

# 9. Recommendation Output

The result page should display:

## Primary Match

- Pathway name
- Match score
- Short explanation
- Available degrees under the pathway

## Secondary Matches

Show two additional pathway suggestions.

Example:

```text
Your Strongest Match

Artificial Intelligence
Pathway Match Score: 100/100

Why this matched:
- You showed strong interest in intelligent systems.
- You preferred prediction and automation-oriented problem solving.
- You selected AI-focused learning and project outcomes.

Available Degree:

BSc (Hons) Artificial Intelligence
Plymouth University - United Kingdom


Other Strong Matches

2. Data Science — 82/100
3. Computer Science — 71/100
```

---

# 10. Explanation Generation

No LLM is required.

Store predefined explanation fragments for each pathway.

Example:

```json
{
  "Artificial Intelligence": [
    "You showed strong interest in intelligent and automated systems.",
    "You preferred systems that learn, predict or make decisions.",
    "Your selected activities align with AI-focused problem solving."
  ],

  "Data Science": [
    "You showed interest in analysing data and discovering patterns.",
    "You preferred quantitative and evidence-based problem solving.",
    "Your selections align with data analysis and predictive modelling."
  ]
}
```

The backend can select 2–3 explanation lines based on the answers that contributed most strongly to the final score.

---

# 11. Suggested Explanation Text by Pathway

## Computer Science

- Strong interest in computing concepts, algorithms and problem solving.
- Preference for understanding how software and computational systems work.
- Suitable for applicants interested in broad computing foundations.

## Data Science

- Strong interest in data analysis, patterns and quantitative problem solving.
- Preference for working with datasets, statistics and analytical models.
- Suitable for applicants interested in extracting insights from data.

## Artificial Intelligence

- Strong interest in intelligent, automated and predictive systems.
- Preference for machine learning and AI-related problem solving.
- Suitable for applicants interested in building systems that can learn or make decisions.

## Computer Security

- Strong interest in system vulnerabilities, secure software and technical protection.
- Preference for finding and fixing weaknesses in computing systems.
- Suitable for applicants interested in application, operating-system and computer security.

## Cyber Security

- Strong interest in cyber threats, network defence and incident response.
- Preference for monitoring, investigating and responding to attacks.
- Suitable for applicants interested in security operations and cyber defence.

## Software Engineering

- Strong interest in designing, developing and maintaining software systems.
- Preference for building complete applications and working in development teams.
- Suitable for applicants interested in professional software development.

## Computer Networks

- Strong interest in network infrastructure, connectivity and communication systems.
- Preference for configuring, troubleshooting and maintaining connected systems.
- Suitable for applicants interested in networking and infrastructure.

## Technology Management

- Strong interest in managing technology, projects and teams.
- Preference for combining technical understanding with leadership and strategy.
- Suitable for applicants interested in technology-focused management roles.

## Management Information Systems

- Strong interest in using technology to improve organizational processes.
- Preference for combining business requirements with information systems.
- Suitable for applicants interested in business systems and digital transformation.

---

# 12. Career Image Feature

The career-image feature is completely separate from the recommendation logic.

The applicant's photo must **not** influence pathway scoring.

System flow:

```text
Applicant completes questionnaire
        ↓
Top pathway is selected
        ↓
Applicant optionally enables camera
        ↓
Applicant captures photo
        ↓
Photo + pathway-specific prompt
        ↓
Image editing/generation model
        ↓
Career-themed professional image
```

---

# 13. Career Mapping

| Pathway | Career Visualization |
|---|---|
| Computer Science | Computing Professional / Software Developer |
| Data Science | Data Scientist |
| Artificial Intelligence | AI Engineer / Robotics Engineer |
| Computer Security | Security Engineer |
| Cyber Security | Cybersecurity Analyst / SOC Analyst |
| Software Engineering | Software Engineer |
| Computer Networks | Network Engineer |
| Technology Management | Technology Manager / IT Project Manager |
| Management Information Systems | Business Systems Analyst |

---

# 14. Image Prompt Templates

The same base identity-preservation instruction should be used for every pathway.

## Base Prompt

```text
Transform the person in the uploaded photograph into a realistic professional
career portrait.

Preserve the person's identity, facial structure, skin tone, hairstyle and
recognizable facial features.

Do not significantly alter the person's face.

Use realistic professional clothing, natural lighting, realistic proportions
and a believable workplace environment.

The final result should look like a professional career visualization rather
than a fantasy or heavily stylized image.
```

---

## Computer Science

```text
Show the person as a computing professional in a modern technology workspace.
Include subtle programming interfaces or development tools on nearby monitors.
Keep the environment realistic and professional.
```

## Data Science

```text
Show the person as a data scientist working in a modern analytics environment.
Include realistic dashboards, charts and data visualizations on nearby screens.
```

## Artificial Intelligence

```text
Show the person as an AI engineer working in a modern intelligent systems or
robotics laboratory. Include subtle AI interfaces, robotics equipment or
machine-learning visualizations in the environment.
```

## Computer Security

```text
Show the person as a computer security engineer in a professional security
engineering workspace. Include secure systems, code analysis interfaces or
security testing tools on nearby monitors.
```

## Cyber Security

```text
Show the person as a cybersecurity analyst working in a professional security
operations center. Include realistic threat-monitoring dashboards and network
security interfaces.
```

## Software Engineering

```text
Show the person as a software engineer working in a modern development
environment. Include realistic coding interfaces and software-development
tools on nearby monitors.
```

## Computer Networks

```text
Show the person as a network engineer in a professional network operations
environment. Include realistic networking equipment, server racks and network
monitoring interfaces.
```

## Technology Management

```text
Show the person as a technology manager in a modern professional office.
Include a technology project-planning environment, dashboards and collaborative
workspace elements.
```

## Management Information Systems

```text
Show the person as a business systems analyst in a modern corporate
technology environment. Include business dashboards, information-system
interfaces and process-planning visuals.
```

---

# 15. Camera Capture

For a browser-based application, live camera access can be implemented using:

```javascript
navigator.mediaDevices.getUserMedia({
  video: true
});
```

Recommended UI:

```text
[ Enable Camera ]

Camera Preview

[ Capture Photo ]

Photo Preview

[ Visualize My Career ]
```

The captured image should only be uploaded after the applicant explicitly chooses to generate the career visualization.

---

# 16. Suggested Application Flow

```text
Landing Page
    ↓
Start Recommendation
    ↓
Question 1
    ↓
Question 2
    ↓
Question 3
    ↓
Question 4
    ↓
Question 5
    ↓
Calculate Scores
    ↓
Top 3 Pathways
    ↓
Show Degrees Available Under Each Pathway
    ↓
Optional Career Visualization
    ↓
Enable Camera
    ↓
Capture Photo
    ↓
Generate Career Image
```

---

# 17. Recommended UI Structure

## Landing Page

Heading:

> Find the Technology Pathway That Fits You

Subheading:

> Answer five quick questions and discover the study pathways that best match your interests.

Button:

> Start Recommendation

---

## Questionnaire Page

Show one question at a time.

Example progress indicator:

```text
Question 3 of 5
████████████░░░░░░
```

Each answer should be displayed as a clickable card rather than a standard dropdown.

---

## Results Page

Suggested structure:

```text
Your Strongest Match

Artificial Intelligence

Pathway Match Score
100 / 100

Why this matched
• Strong interest in intelligent systems
• Preference for predictive and automated solutions
• Interest in AI-focused project outcomes

Available Degree

BSc (Hons) Artificial Intelligence
Plymouth University - United Kingdom


Other Matches

Data Science
82 / 100

Computer Science
71 / 100


See Yourself in Your Future Career

[ Enable Camera ]
```

---

# 18. Suggested Backend Structure

```text
backend/
│
├── main.py
│
├── data/
│   ├── pathways.json
│   ├── degrees.json
│   ├── questions.json
│   └── career_prompts.json
│
├── services/
│   ├── recommendation_service.py
│   └── image_generation_service.py
│
└── utils/
    └── scoring.py
```

---

# 19. Suggested Frontend Structure

For a React-based frontend:

```text
src/
│
├── components/
│   ├── QuestionCard.jsx
│   ├── ProgressBar.jsx
│   ├── PathwayResult.jsx
│   ├── DegreeCard.jsx
│   ├── CameraCapture.jsx
│   └── CareerImage.jsx
│
├── pages/
│   ├── Home.jsx
│   ├── Questionnaire.jsx
│   └── Results.jsx
│
├── data/
│   └── fallbackData.js
│
└── services/
    └── api.js
```

---

# 20. Minimum API Endpoints

## GET `/api/pathways`

Returns all supported pathways.

---

## GET `/api/degrees`

Returns all degree programmes and pathway mappings.

---

## GET `/api/questions`

Returns the 5 questionnaire questions.

---

## POST `/api/recommend`

Request:

```json
{
  "answers": [
    {
      "question_id": 1,
      "option_id": "C"
    },
    {
      "question_id": 2,
      "option_id": "D"
    },
    {
      "question_id": 3,
      "option_id": "C"
    },
    {
      "question_id": 4,
      "option_id": "D"
    },
    {
      "question_id": 5,
      "option_id": "D"
    }
  ]
}
```

Response:

```json
{
  "recommendations": [
    {
      "pathway": "Artificial Intelligence",
      "raw_score": 15,
      "display_score": 100,
      "label": "Strongest Match",
      "degrees": [
        {
          "name": "BSc (Hons) Artificial Intelligence",
          "university": "Plymouth University - United Kingdom"
        }
      ]
    },
    {
      "pathway": "Data Science",
      "raw_score": 6,
      "display_score": 40,
      "label": "Strong Match"
    },
    {
      "pathway": "Computer Science",
      "raw_score": 4,
      "display_score": 27,
      "label": "Related Match"
    }
  ]
}
```

---

## POST `/api/career-image`

Input:

- captured image
- selected pathway

Response:

```json
{
  "image_url": "generated-image-url"
}
```

---

# 21. Recommended Data Model

## Pathway

```json
{
  "id": "artificial_intelligence",
  "name": "Artificial Intelligence",
  "career": "AI Engineer",
  "description": "Focuses on intelligent systems, machine learning and automation."
}
```

## Degree

```json
{
  "id": "plymouth_bsc_ai",
  "name": "BSc (Hons) Artificial Intelligence",
  "university": "Plymouth University - United Kingdom",
  "pathway": "Artificial Intelligence"
}
```

## Question

```json
{
  "id": 1,
  "text": "Which type of activity sounds most interesting to you?",
  "options": [
    {
      "id": "A",
      "text": "Building software applications",
      "weights": {
        "Software Engineering": 3,
        "Computer Science": 2
      }
    }
  ]
}
```

---

# 22. Important Design Rules

1. **Recommend pathways, not individual degrees.**
2. Degrees are displayed only after a pathway is recommended.
3. A pathway may contain degrees from multiple universities.
4. Degree availability must not affect pathway scoring.
5. The applicant photo must never affect recommendation scoring.
6. The career image feature is optional and should be described as visualization only.
7. Do not describe the rule-based score as a probability of success.
8. Keep all pathway weights configurable in JSON so they can be changed without editing application code.
9. Keep degree data separate from recommendation rules.
10. Return the Top 3 pathway recommendations instead of forcing one result.

---

# 23. MVP Scope for Delivery

## Required

- 5-question questionnaire
- Rule-based scoring
- Top 3 pathway recommendations
- Pathway score display
- Short explanation for recommendations
- Degree list under each pathway
- University name for each degree
- Clean results page

## Highly Recommended

- Camera capture
- Career-image generation
- Career visualization for the strongest pathway

## Not Required for MVP

- User accounts
- Login system
- Recommendation history
- Database
- Machine-learning recommender
- LLM backend
- RAG
- Admin dashboard
- Analytics
- Model training
- Complex applicant profiling

---

# 24. Final System Summary

The complete MVP can be represented as:

```text
5 Questions
    ↓
Rule-Based Weighting
    ↓
Score 9 Pathways
    ↓
Rank Results
    ↓
Top 3 Pathways
    ↓
Map Recommended Pathway → Available Degrees
    ↓
Display University + Degree Options
    ↓
Optional Camera Capture
    ↓
Generate Career-Themed Applicant Image
```

This design keeps the recommendation system:

- Fast
- Explainable
- Easy to modify
- Easy to demonstrate
- Independent of university-specific degree naming
- Suitable for an MVP with a short development deadline
