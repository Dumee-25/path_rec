import { useEffect } from "react";

const SUFFIX = "NSBM Faculty of Computing";

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} | ${SUFFIX}`;
  }, [title]);
}
