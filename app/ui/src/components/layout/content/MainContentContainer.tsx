import type { JSX } from "react/jsx-runtime";

// TODO: More config options? Like width?
// TODO: Only allow ContentSections? Or in any case a limited set of elements?
// TODO: Better name??
export default function MainContentContainer({
  children,
  className,
}: {
  children: JSX.Element | JSX.Element[];
  className?: string;
}): JSX.Element {
  return (
    <main className={["content", className].filter(Boolean).join(" ")}>
      {children}
    </main>
  );
}
