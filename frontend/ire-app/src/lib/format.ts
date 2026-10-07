import { format as formatDate, isValid, parse as parseDate } from "date-fns";

const SIG3 = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 3 });

/** Prices are tiny (e.g. 0.00015) — three significant figures keeps them readable. */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  return SIG3.format(value);
}

export function formatUsd(value: number | null | undefined): string {
  const formatted = formatPrice(value);
  return formatted === "n/a" ? "n/a" : `$${formatted}`;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = parseDate(trimmed, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : null;
  }
  const date = new Date(trimmed);
  return isValid(date) ? date : null;
}

/** Short time-zone label for the visitor, e.g. "GMT+2" or "PST". */
export function timeZoneLabel(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
    }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** "12 Jun 2025, 14:03 GMT+2" — always the visitor's local time. */
export function formatLocalDateTime(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "not stated";
  const tz = timeZoneLabel(date);
  return `${formatDate(date, "d MMM yyyy, HH:mm")}${tz ? ` ${tz}` : ""}`;
}

/** "Fri 12 Jun 2025" from a YYYY-MM-DD day stamp. */
export function formatDay(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return value ?? "not stated";
  return formatDate(date, "EEE d MMM yyyy");
}

export function isStaleNow(staleAfter: string | null | undefined): boolean {
  const date = toDate(staleAfter);
  if (!date) return false;
  return Date.now() > date.getTime();
}

export function shortSha(value: string | null | undefined, length = 10): string {
  if (!value) return "not recorded";
  return value.length > length ? value.slice(0, length) : value;
}

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function commitUrl(sourceRepo: string, sha: string | null): string | null {
  const repo = trimTrailingSlash(sourceRepo);
  if (!repo || !sha) return null;
  return `${repo}/commit/${sha}`;
}

/** "Pukujan/inference-recommendation-engine" from a full repository URL. */
export function repoSlug(sourceRepo: string): string {
  const repo = trimTrailingSlash(sourceRepo);
  if (!repo) return "not stated";
  return repo.split("/").slice(-2).join("/");
}
