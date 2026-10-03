import { useEffect, useState } from "react";
import { getPathways } from "../services/api";
import type { Pathway } from "../types";

/** The pathways for the landing page, or null until they load (or if they cannot). */
export function usePathways(): Pathway[] | null {
  const [pathways, setPathways] = useState<Pathway[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPathways().then(
      (loaded) => {
        if (!cancelled) setPathways(loaded);
      },
      () => {
        // The landing page is complete without this section, so a failure is not shown.
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return pathways;
}
