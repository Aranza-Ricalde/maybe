import type { CategoryOption } from "@/components/viewModels";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export interface CategoryNativeSelectProps {
  name: string;
  options: CategoryOption[];
  defaultValue: number | null;
}

export function CategoryNativeSelect({ name, options, defaultValue }: CategoryNativeSelectProps) {
  return (
    <NativeSelect size="sm" name={name} defaultValue={defaultValue != null ? String(defaultValue) : ""} aria-label="Categoría" className="max-w-48">
      <NativeSelectOption value="">Sin categoría</NativeSelectOption>
      {options.map((option) => (
        <NativeSelectOption key={option.id} value={option.id}>
          {option.label ?? option.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
