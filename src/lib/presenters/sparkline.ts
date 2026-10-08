const PADDING = 2;

export function sparklinePath(values: number[], width: number, height: number): string | null {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const innerWidth = width - PADDING * 2;
  const innerHeight = height - PADDING * 2;
  const step = innerWidth / (values.length - 1);
  return values
    .map((value, index) => {
      const x = PADDING + index * step;
      const y = range === 0 ? height / 2 : PADDING + innerHeight - ((value - min) / range) * innerHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}
