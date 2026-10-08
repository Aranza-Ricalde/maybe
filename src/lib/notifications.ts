import { toast } from "sonner";
import { notificationOptions } from "./notificationOptions";

export const notify = {
  info: (title: string, description?: string, durationMs?: number) => toast.info(title, notificationOptions("info", description, durationMs)),
  success: (title: string, description?: string, durationMs?: number) => toast.success(title, notificationOptions("success", description, durationMs)),
  warning: (title: string, description?: string, durationMs?: number) => toast.warning(title, notificationOptions("warning", description, durationMs)),
  error: (title: string, description?: string, durationMs?: number) => toast.error(title, notificationOptions("error", description, durationMs)),
};
