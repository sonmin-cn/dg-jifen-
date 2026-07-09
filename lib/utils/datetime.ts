const CN_TIME_ZONE = "Asia/Shanghai";

// en-CA 输出 YYYY-MM-DD；sv-SE 输出 YYYY-MM-DD HH:mm:ss
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: CN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateCN(value: DateInput): string {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "-";
}

export function formatDateTimeCN(value: DateInput): string {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "-";
}
