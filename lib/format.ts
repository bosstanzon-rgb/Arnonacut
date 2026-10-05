const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";

  const deltaSeconds = Math.round((then - now) / 1000);
  const abs = Math.abs(deltaSeconds);

  if (abs < 60) return relative.format(deltaSeconds, "second");
  if (abs < 3600) return relative.format(Math.round(deltaSeconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(deltaSeconds / 3600), "hour");
  if (abs < 86400 * 7) {
    return relative.format(Math.round(deltaSeconds / 86400), "day");
  }
  return formatAbsoluteTime(iso);
}

export function formatAbsoluteTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}
