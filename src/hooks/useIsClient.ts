import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => undefined;

export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}
