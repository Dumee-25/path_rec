import type { Degree } from "../types";

export interface UniversitySummary {
  name: string;
  country: string | null;
  programmes: number;
}

/** Group degree programmes by university, keeping the order in which universities first appear. */
export function summariseUniversities(degrees: Degree[]): UniversitySummary[] {
  const byName = new Map<string, UniversitySummary>();
  for (const degree of degrees) {
    const existing = byName.get(degree.university);
    if (existing) existing.programmes += 1;
    else byName.set(degree.university, { name: degree.university, country: degree.country, programmes: 1 });
  }
  return [...byName.values()];
}
