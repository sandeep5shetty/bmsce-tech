export function isMissingReportTableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code =
    "code" in error
      ? String((error as { code: unknown }).code)
      : undefined;
  if (code === "42P01") return true;
  const cause = "cause" in error ? (error as { cause: unknown }).cause : null;
  if (typeof cause === "object" && cause !== null && "code" in cause) {
    return String((cause as { code: unknown }).code) === "42P01";
  }
  return false;
}
