export const SERVICE_CATEGORIES = [
  "Healthcare & Dental",
  "Sports & Fitness",
  "Beauty & Wellness",
  "Classes & Coaching",
  "Other",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const OTHER_CATEGORY: ServiceCategory = "Other";

export function isServiceCategory(value: string): value is ServiceCategory {
  return SERVICE_CATEGORIES.includes(value as ServiceCategory);
}
