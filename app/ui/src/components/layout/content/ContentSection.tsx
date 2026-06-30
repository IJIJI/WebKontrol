import type { JSX } from "react/jsx-runtime";

// TODO: More features? Collapsible? Pre header? Title?
export default function ContentSection({children, transparent, className}: {children: JSX.Element | JSX.Element[], transparent: boolean, className?: string}): JSX.Element {

  return (
    <section className={["content", className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}