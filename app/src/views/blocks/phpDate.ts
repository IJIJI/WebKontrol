// A PHP-style date formatter for the datetime block: the common token subset, local time,
// English names (as in PHP). The schema's format regex admits exactly the tokens this file
// implements; extend both together.

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** The supported format tokens; kept in sync with the token() switch below. */
export const PHP_DATE_TOKENS = "dDjlNSwFmMnYyaAgGhHis";

const pad2 = (n: number): string => String(n).padStart(2, "0");

const ordinal = (day: number): string => {
  if (day >= 11 && day <= 13) return "th";
  return ["th", "st", "nd", "rd"][day % 10] ?? "th";
};

function token(ch: string, d: Date): string {
  switch (ch) {
    case "d": return pad2(d.getDate());
    case "j": return String(d.getDate());
    case "D": return DAYS_SHORT[d.getDay()];
    case "l": return DAYS_LONG[d.getDay()];
    case "N": return String(d.getDay() === 0 ? 7 : d.getDay()); // ISO: Mon=1 .. Sun=7
    case "S": return ordinal(d.getDate());
    case "w": return String(d.getDay());
    case "F": return MONTHS_LONG[d.getMonth()];
    case "M": return MONTHS_SHORT[d.getMonth()];
    case "m": return pad2(d.getMonth() + 1);
    case "n": return String(d.getMonth() + 1);
    case "Y": return String(d.getFullYear());
    case "y": return pad2(d.getFullYear() % 100);
    case "a": return d.getHours() < 12 ? "am" : "pm";
    case "A": return d.getHours() < 12 ? "AM" : "PM";
    case "g": return String(d.getHours() % 12 || 12);
    case "G": return String(d.getHours());
    case "h": return pad2(d.getHours() % 12 || 12);
    case "H": return pad2(d.getHours());
    case "i": return pad2(d.getMinutes());
    case "s": return pad2(d.getSeconds());
    default: return ch; // separators pass through; the schema admits nothing else
  }
}

/** Format `date` per the PHP-style `format` string. `\x` escapes a literal character. */
export function formatPhpDate(format: string, date: Date): string {
  let out = "";
  for (let i = 0; i < format.length; i++) {
    const ch = format[i];
    if (ch === "\\") {
      out += format[++i] ?? "";
      continue;
    }
    out += token(ch, date);
  }
  return out;
}
