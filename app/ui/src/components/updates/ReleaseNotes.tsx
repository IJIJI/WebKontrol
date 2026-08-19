import { type JSX } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkGithubAlerts from "remark-github-alerts";

import "./releaseNotes.less";

/**
 * A release body rendered as markdown: GitHub flavour (tables, task lists, strikethrough)
 * plus GitHub's alert blocks. Raw HTML in a body is escaped rather than rendered, which is
 * react-markdown's default and stays that way deliberately: the notes come off the network.
 * Links open in a new tab, since this page is the admin and a release page is not.
 */

// GitHub bodies often carry a two-space hard break after an alert header:
//   > [!CAUTION]··\n> text
// Valid markdown for a <br>, which renders as a stray blank line inside the alert. Only
// that case is stripped, so hard breaks anywhere else still work. (Ported from Beacon.)
function normalizeAlertHeaderLineBreaks(markdown: string): string {
  return markdown.replace(
    /(^>\s*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\])\s{2,}(\r?\n)/gm,
    "$1$2",
  );
}

export function ReleaseNotes({ body }: { body: string }): JSX.Element {
  if (body.trim() === "")
    return <span className="releaseNotesEmpty">No release notes available.</span>;

  return (
    <div className="releaseNotes">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkGithubAlerts]}
        components={{
          // `node` is react-markdown's own AST handle: dropped here, or React would put
          // it on the element as an invalid attribute.
          a: ({ node: _node, children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {normalizeAlertHeaderLineBreaks(body)}
      </ReactMarkdown>
    </div>
  );
}
