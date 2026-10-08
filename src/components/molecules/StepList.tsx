import { Check } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";

export interface StepListItem {
  title: string;
  description: string;
}

export function StepList({ steps, current = 0 }: { steps: StepListItem[]; current?: number }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li key={step.title} aria-current={active ? "step" : undefined} className={cn("flex gap-3 rounded-lg border p-3 transition-colors", active && "border-primary bg-primary/5", current > 0 && !done && !active && "opacity-60")}>
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", done || active || current === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {done ? <Check className="size-3.5" /> : number}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <Text weight="medium">{step.title}</Text>
              <Text size="xs" tone="muted">
                {step.description}
              </Text>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
