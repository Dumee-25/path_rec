export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
}

export interface Degree {
  id: string;
  name: string;
  university: string;
  country: string | null;
  pathway: string;
}

export interface Recommendation {
  rank: number;
  pathway: string;
  pathway_id: string;
  career: string;
  summary: string;
  raw_score: number;
  display_score: number;
  label: string;
  reasons: string[];
  degrees: Degree[];
}

/** Option id chosen for each question id. */
export type Answers = Record<number, string>;

export interface CareerImageStatus {
  configured: boolean;
  provider: string;
}
