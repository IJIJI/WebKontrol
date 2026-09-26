# Conventions

How work is done in this repo. Follow these in every session.

## Before changing anything

- Read [overview.md](overview.md), this file, and the entries in [decisions.md](decisions.md)
  and [todo.md](todo.md) that touch the task.
- **Consult before every change.** Propose the concrete change (files, what changes, why) and
  wait for a yes. A task listed as next in `NOTES.md` or `todo.md` is not a go-ahead.
- **Ask when unsure.** Anything not completely certain, or where reasonable people would choose
  differently (a library, a layout, a name, what to defer), is a question, not a silent
  decision. Do the parts that do not depend on the answer, then ask: numbered, with a
  recommendation first.
- **No unrequested changes.** Never alter presentation, behaviour or a settled decision that
  was not asked for; raise it and wait. Prefer targeted edits over rewriting a file, since a
  rewrite silently reverts what someone else changed.
- A decision in `decisions.md` stays settled unless new facts appear.

## While working

- Fix root causes, in the one place every caller goes through.
- Test what changed where it runs: a scratch box for server and admin changes, a managed
  scratch box for anything that depends on being installed, real hardware for the Pi. The
  recipes are in [release.md](release.md).
- Record decisions, definitions and findings the moment they are made, in the matching file
  here, in the same change as the code.

## After each piece of work

1. **Review it in 3 to 6 passes**, each with one lens: SOLID, KISS and YAGNI, bugs, code smells
   (refactoring.guru), design patterns where they genuinely fit, an outside read. Fix real bugs
   directly; raise everything else. Report the passes and what each changed.
2. **Hand over a commit list** covering every uncommitted file: one table per commit (file,
   status: created, modified, deleted, moved, renamed; a short note), then the commit message,
   a plain explanation, and the commands. If the tree is midway through a group, say it is
   not committable yet rather than inventing a boundary.

## Git

- Only the maintainer runs git commands that change state (add, commit, push, branch, tag,
  merge, reset, stash). Read-only git (status, diff, log, show) is fine for anyone.
- Give staging and committing as two separate commands, each in its own code block, never
  chained, with paths that work from `app/` (repo-root files are `../README.md` and so on).
- Commit messages are one line. No attribution of any tool anywhere: no co-author trailers,
  no "generated with" lines, not in commits, pull requests, release notes, code, comments or
  docs.

## Todo and backlog

- [todo.md](todo.md) holds work with a set moment: what is being done now, and items already
  placed at a point (for example "right after the first stable release"). Entry: moment, what,
  done when, notes.
- [backlog.md](backlog.md) holds work with no moment yet. It is picked from when the todo is
  done, or when an item fits the current work. Entry: what, why not now, trigger, notes.
  Reassess an old entry against the code before starting it.
- Once an item has a moment it moves to the todo. A finished item is removed; git keeps the
  record, and its release notes say what shipped.

## Writing

- English in code, comments, commits and docs.
- No em dashes (and no en dashes used the same way): use a comma, a colon, brackets, or split
  the sentence. Hyphens in compound words are fine.
- Plain and direct; say what something does and why, not how clever it is.
- The README's Backstory: only the sentence about the current version may be edited without
  asking.

## Code

- TypeScript, strict. Zod schemas are the source of truth for config and stored data; object
  fallbacks use `.prefault(...)`, leaf fallbacks `.default(x)`.
- Non-trivial logic gets an assert-based `*.check.ts` beside it, added to `yarn check`. There
  is no test framework.
- A block declares its editor label, description and icon id in the `info` object of
  `defineBlock`; the editor reads the registry, never a separate map.
- Editor fields: every rich widget is an assist over the raw value, never a replacement;
  constraints come from the zod schema; `FieldMeta.input` is the single dispatch point; a new
  capability gets a config field first, rich UI later.
- Admin: `withToast` is the only owner of toasts; drafts do not own toasts or navigation
  guarding; the trash icon destroys, the cross dismisses.
- About 120 small inline `TODO` comments are not tracked here; handle one when touching its
  file.
