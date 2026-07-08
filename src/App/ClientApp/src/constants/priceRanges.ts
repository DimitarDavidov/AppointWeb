export interface PriceRange {
  id: string;
  label: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { id: "under-25", label: "Under €25", min: 0, max: 25 },
  { id: "25-50", label: "€25 – €50", min: 25, max: 50 },
  { id: "50-100", label: "€50 – €100", min: 50, max: 100 },
  {
    id: "over-100",
    label: "Over €100",
    min: 100,
    max: Number.POSITIVE_INFINITY,
  },
];

export function getPriceRangeById(id: string | null): PriceRange | null {
  if (!id) return null;
  return PRICE_RANGES.find((range) => range.id === id) ?? null;
}
