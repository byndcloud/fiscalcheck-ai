const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

function pickUnit(diffSeconds: number): { divisor: number; unit: Intl.RelativeTimeFormatUnit } {
  if (diffSeconds < 60) return { divisor: 1, unit: "second" };
  if (diffSeconds < 3_600) return { divisor: 60, unit: "minute" };
  if (diffSeconds < 86_400) return { divisor: 3_600, unit: "hour" };
  return { divisor: 86_400, unit: "day" };
}

/** Formata um timestamp ISO como "há X min"/"agora" em pt-BR. */
export function formatRelativeTime(isoTimestamp: string, now: Date = new Date()): string {
  const diffSeconds = Math.round((now.getTime() - new Date(isoTimestamp).getTime()) / 1000);

  if (diffSeconds < 5) {
    return "agora mesmo";
  }

  const { divisor, unit } = pickUnit(diffSeconds);
  const value = Math.round(diffSeconds / divisor);
  return RELATIVE_TIME_FORMATTER.format(-value, unit);
}
