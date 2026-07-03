export function capitalizeFirstLetter(value: string): string {
  if (!value) return "User";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
