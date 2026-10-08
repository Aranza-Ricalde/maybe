import { splitHeroAmount } from "@/lib/presenters/dashboard";
import { cn } from "@/lib/utils";

export function HeroAmount({ cents, className }: { cents: number; className?: string }) {
  const { whole, cents: fraction, negative } = splitHeroAmount(cents);
  return (
    <p className={cn("text-5xl leading-none font-semibold tracking-tight tabular-nums md:text-6xl", className)} style={negative ? { color: "var(--danger)" } : undefined}>
      {negative && "−"}
      {whole}
      <span className="text-2xl font-medium text-muted-foreground md:text-3xl">{fraction}</span>
    </p>
  );
}
