const toLatinDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632));

const div = (a: number, b: number) => Math.floor(a / b);

const jalaliToGregorian = (jy: number, jm: number, jd: number) => {
  let jDayNo =
    365 * (jy - 979) +
    div(jy - 979, 33) * 8 +
    div((jy - 979) % 33 + 3, 4) +
    jd -
    1;
  for (let i = 0; i < jm - 1; ++i) {
    jDayNo += i < 6 ? 31 : 30;
  }

  let gDayNo = jDayNo + 79;
  let gy = 1600 + 400 * div(gDayNo, 146097);
  gDayNo %= 146097;

  let leap = true;
  if (gDayNo >= 36525) {
    gDayNo--;
    gy += 100 * div(gDayNo, 36524);
    gDayNo %= 36524;
    if (gDayNo >= 365) {
      gDayNo++;
    } else {
      leap = false;
    }
  }

  gy += 4 * div(gDayNo, 1461);
  gDayNo %= 1461;
  if (gDayNo >= 366) {
    leap = false;
    gDayNo--;
    gy += div(gDayNo, 365);
    gDayNo %= 365;
  }

  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 12 && gDayNo >= monthDays[gm]) {
    gDayNo -= monthDays[gm];
    gm++;
  }
  const gd = gDayNo + 1;
  return { gy, gm: gm + 1, gd };
};

const to2 = (value: number) => String(value).padStart(2, "0");

export const parseGregorianInputToIso = (value: string): string | null => {
  if (!value.trim()) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

export const formatIsoToGregorianInput = (iso?: string | null): string => {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${to2(date.getMonth() + 1)}-${to2(date.getDate())}T${to2(date.getHours())}:${to2(date.getMinutes())}`;
};

export const parseJalaliInputToIso = (value: string): string | null => {
  const normalized = toLatinDigits(value).trim();
  const match = normalized.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    return null;
  }
  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31 || hour > 23 || minute > 59) {
    return null;
  }
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const date = new Date(gy, gm - 1, gd, hour, minute, 0, 0);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

export const formatIsoToJalaliInput = (iso?: string | null): string => {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const pick = (type: string) => toLatinDigits(parts.find((part) => part.type === type)?.value ?? "");
  const y = pick("year");
  const m = pick("month");
  const d = pick("day");
  const h = pick("hour");
  const min = pick("minute");
  if (!y || !m || !d || !h || !min) {
    return "";
  }
  return `${y}/${m}/${d} ${h}:${min}`;
};
