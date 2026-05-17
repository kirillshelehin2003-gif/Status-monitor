export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function percent(value: number | null | undefined, fallback = "н/д"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${Math.round(value)}%`;
}
