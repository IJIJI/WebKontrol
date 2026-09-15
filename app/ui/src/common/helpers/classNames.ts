export type ClassValue = string | false | null | undefined;

// Join truthy class names into one className string, dropping falsy entries (e.g. from
// `condition && "active"`). The minimal slice of clsx/classnames — no dependency needed.
//   classNames("btn", isActive && "active", size) => "btn active md"
export const classNames = (...classes: ClassValue[]): string => classes.filter(Boolean).join(" ");
