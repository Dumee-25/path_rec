import type { Degree, Pathway, Question, Recommendation } from "../types";

export const questions: Question[] = [1, 2, 3, 4, 5].map((id) => ({
  id,
  text: `Question text ${id}`,
  options: [
    { id: "A", text: `Option A${id}` },
    { id: "B", text: `Option B${id}` },
  ],
}));

const plymouthAi: Degree = {
  id: "plymouth_bsc_artificial_intelligence",
  name: "BSc (Hons) Artificial Intelligence",
  university: "Plymouth University",
  country: "United Kingdom",
  pathway: "Artificial Intelligence",
};

const nsbmDataScience: Degree = {
  id: "nsbm_bsc_data_science",
  name: "BSc (Hons) in Data Science",
  university: "NSBM Green University",
  country: null,
  pathway: "Data Science",
};

export const recommendations: Recommendation[] = [
  {
    rank: 1,
    pathway: "Artificial Intelligence",
    pathway_id: "artificial_intelligence",
    career: "AI Engineer / Robotics Engineer",
    summary: "Focuses on intelligent systems, machine learning and automation.",
    raw_score: 15,
    display_score: 100,
    label: "Strongest Match",
    reasons: [
      "You showed interest in intelligent and automated systems.",
      "You prefer systems that learn, predict or make decisions.",
    ],
    degrees: [plymouthAi],
  },
  {
    rank: 2,
    pathway: "Data Science",
    pathway_id: "data_science",
    career: "Data Scientist",
    summary: "Focuses on analysing data.",
    raw_score: 5,
    display_score: 33,
    label: "Strong Match",
    reasons: ["You prefer to answer questions by analysing data."],
    degrees: [nsbmDataScience],
  },
  {
    rank: 3,
    pathway: "Computer Science",
    pathway_id: "computer_science",
    career: "Computing Professional / Software Developer",
    summary: "Focuses on computing foundations.",
    raw_score: 2,
    display_score: 13,
    label: "Related Match",
    reasons: ["Several of your answers relate to this pathway."],
    degrees: [],
  },
];

export const allAnswered = { 1: "A", 2: "B", 3: "A", 4: "B", 5: "A" };

export const pathways: Pathway[] = [
  { id: "computer_science", name: "Computer Science", career: "Computing Professional", description: "Focuses on computing foundations." },
  { id: "data_science", name: "Data Science", career: "Data Scientist", description: "Focuses on analysing data." },
  { id: "artificial_intelligence", name: "Artificial Intelligence", career: "AI Engineer", description: "Focuses on intelligent systems." },
];

export const degrees: Degree[] = [
  { id: "nsbm_cs", name: "BSc (Hons) in Computer Science", university: "NSBM Green University", country: null, pathway: "Computer Science" },
  { id: "nsbm_ds", name: "BSc (Hons) in Data Science", university: "NSBM Green University", country: null, pathway: "Data Science" },
  { id: "plym_ai", name: "BSc (Hons) Artificial Intelligence", university: "Plymouth University", country: "United Kingdom", pathway: "Artificial Intelligence" },
  { id: "vic_cyber", name: "Bachelor of Information Technology (Cyber Security)", university: "Victoria University", country: "Australia", pathway: "Cyber Security" },
];
