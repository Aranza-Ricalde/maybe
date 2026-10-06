export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
}

export interface SegmentedButtonsProps<V extends string> {
  options: ReadonlyArray<SegmentedOption<V>>;
  value: V;
  onChange: (value: V) => void;
  activeClassName: string;
}

const BASE_CLASSNAME = "rounded-full px-3 py-1.5 text-xs font-medium transition-colors";
const INACTIVE_CLASSNAME = "text-muted hover:bg-separator";

export const ACTIVE_ACCENT = "bg-accent text-accent-foreground";
export const ACTIVE_NEUTRAL = "bg-separator text-foreground";

export function SegmentedButtons<V extends string>({ options, value, onChange, activeClassName }: SegmentedButtonsProps<V>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`${BASE_CLASSNAME} ${value === option.value ? activeClassName : INACTIVE_CLASSNAME}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
