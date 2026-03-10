const STORAGE_KEY = "pollenApiKey";

export function getPollenHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const key = localStorage.getItem(STORAGE_KEY);
    if (key && key.trim()) {
      return { "X-Pollen-Key": key.trim() };
    }
  } catch {
    // Ignore storage access issues.
  }

  return {};
}

