import { useEffect } from "react";

const AUTO_CLOSE_MS = 4000;

export function useAutoClearFinished(allDone: boolean, clear: () => void): void {
  useEffect(() => {
    if (!allDone) return;
    const timer = setTimeout(clear, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [allDone, clear]);
}
