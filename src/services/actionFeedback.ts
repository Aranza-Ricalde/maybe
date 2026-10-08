import { GENERIC_FAILURE_MESSAGE, isFailed, type ActionResult, type FormAction } from "@/lib/actionResult";
import { notify } from "@/lib/notifications";

export interface Notifier {
  success(message: string): void;
  error(message: string): void;
}

export const toastNotifier: Notifier = {
  success: (message) => void notify.success(message),
  error: (message) => void notify.error(message),
};

export function reportResult(result: ActionResult | void, notifier: Notifier = toastNotifier): boolean {
  if (result == null) return true;
  if (isFailed(result)) notifier.error(result.message);
  else notifier.success(result.message);
  return result.ok;
}

export function withFeedback(action: FormAction, notifier: Notifier = toastNotifier): (formData: FormData) => Promise<boolean> {
  return async (formData) => {
    try {
      return reportResult(await action(formData), notifier);
    } catch {
      notifier.error(GENERIC_FAILURE_MESSAGE);
      return false;
    }
  };
}
