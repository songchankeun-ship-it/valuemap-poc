const EXPLICIT_TIMEZONE = /(?:Z|[+-]\d{2}:\d{2})$/i;
const LOCAL_ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

/**
 * Dataset generators currently emit a timezone-less Python ISO timestamp while
 * running on Korea time. Make that contract explicit so Node's host timezone
 * cannot change the instant between local builds and UTC production servers.
 */
export function parseDatasetGeneratedAt(value: string | undefined): Date | undefined {
  if (!value) return undefined;

  const normalized = EXPLICIT_TIMEZONE.test(value)
    ? value
    : LOCAL_ISO_DATETIME.test(value)
      ? `${value}+09:00`
      : undefined;
  if (!normalized) return undefined;

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
