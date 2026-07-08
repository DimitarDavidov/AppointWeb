export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function getSupportedTimeZones(): string[] {
  const withValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };

  try {
    const zones = withValues.supportedValuesOf?.("timeZone");
    if (zones && zones.length > 0) {
      return zones;
    }
  } catch {
    // Fall through to a minimal fallback below.
  }

  const browserZone = getBrowserTimeZone();
  return Array.from(new Set(["UTC", browserZone])).sort();
}
