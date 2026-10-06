import type { CategoryOption } from "@/components/viewModels";

export interface CategoryNativeSelectProps {
  name: string;
  options: CategoryOption[];
  defaultValue: number | null;
}

export function CategoryNativeSelect({ name, options, defaultValue }: CategoryNativeSelectProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue != null ? String(defaultValue) : ""}
      aria-label="Categoría"
      className="h-8 max-w-48 rounded-lg border border-separator bg-surface px-2 text-xs text-foreground focus:outline-2 focus:outline-accent"
    >
      <option value="">Sin categoría</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label ?? option.name}
        </option>
      ))}
    </select>
  );
}
