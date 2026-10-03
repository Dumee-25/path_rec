import { useEffect, useState } from "react";
import { getDegrees, getPathways } from "../services/api";
import type { Degree, Pathway } from "../types";

export interface CatalogOverview {
  pathways: Pathway[];
  degrees: Degree[];
}

/** The pathways and degrees for the landing page, or null until they load (or if they cannot). */
export function useCatalogOverview(): CatalogOverview | null {
  const [overview, setOverview] = useState<CatalogOverview | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPathways(), getDegrees()]).then(
      ([pathways, degrees]) => {
        if (!cancelled) setOverview({ pathways, degrees });
      },
      () => {
        // The landing page is complete without these sections, so a failure is not shown.
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return overview;
}
