export function isValidHttpUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== "string") {
    return false;
  }

  const trimmed = urlString.trim();

  // Reject unsafe schemes explicitly
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("vbscript:")
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
