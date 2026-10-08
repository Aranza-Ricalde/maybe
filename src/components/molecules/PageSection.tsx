import type { ReactNode } from "react";

export interface PageSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function PageSection({ id, title, description, children }: PageSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-16 flex-col gap-4">
      <div>
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
