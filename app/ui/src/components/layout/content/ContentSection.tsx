import type { JSX } from "react/jsx-runtime";

import "./content.less";

// TODO: Keep in sync with options from sections.less somehow?
export type SectionVariant = 'opaque' | 'glass';

// TODO: More features? Collapsible? Pre header? Title?
export default function ContentSection({children, variant = 'opaque', className}: {children: JSX.Element | JSX.Element[], variant?: SectionVariant, className?: string}): JSX.Element {

  return (
    <section className={["content", variant, className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}