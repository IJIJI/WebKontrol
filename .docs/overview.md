# WebKontrol: overview

Read this first, then [conventions.md](conventions.md). Before proposing or changing
anything, check [decisions.md](decisions.md) (settled, do not re-argue) and
[todo.md](todo.md) (what is planned and when).

| File | What it holds |
|---|---|
| [conventions.md](conventions.md) | How work is done here: consulting, reviews, commits, writing rules |
| [architecture.md](architecture.md) | How the code is put together, file by file where it matters |
| [decisions.md](decisions.md) | Open questions, then settled decisions with the rejected alternatives |
| [todo.md](todo.md) | Work with a set moment |
| [backlog.md](backlog.md) | Work with no moment yet |
| [release.md](release.md) | The release runbook and the testing recipes |
| [pi-image.md](pi-image.md) | The Raspberry Pi image: design, hardware facts, dead ends |

`NOTES.md` at the repo root is the session handoff: where the last session stopped and the
single next step. These `.docs/` files are the lasting record; keep them current in the same
change as the code (see conventions).

## What WebKontrol is

WebKontrol turns a machine into a remote-controlled display. It drives one or more screens
(**puppets**), each a fullscreen browser showing a **view**: a website URL, or a page built
from blocks in the web admin. Everything is managed from that admin on any device in the
network. There is a ready-made Raspberry Pi image, and installed systems update themselves
from the admin. It is built for live production (clocks, timers, stage and studio signs) and
works for information displays and kiosks.

v3 is a rewrite of v2 (one browser, one URL); v2 is no longer developed. v2 and v3 share no
config or database.

## Repository

| Path | What |
|---|---|
| `app/` | The application (all code below is relative to it unless stated) |
| `app/app.ts` | The app process: process guards, then `LifeCycle` |
| `app/supervisor.ts` | Keeps the app running and rolls back failed updates |
| `app/src/` | Server side: puppets, views and blocks, web server, updates, storage |
| `app/ui/` | The admin (React, Vite) |
| `app/config/config.yaml` | The tracked, commented example config; `config.local.yaml` beside it replaces it entirely |
| `app/scripts/` | Build assembly (`assembleDist.ts`) and the update end-to-end test |
| `install.mjs` | The installer: creates a managed install from a release tarball |
| `pi-image/` | The Raspberry Pi image build (rpi-image-gen) |
| `.github/workflows/release.yml` | The only workflow: builds and attaches the tarball and the image to a published release |
| `README.md`, `img/` | User documentation and its screenshots |
| `splash.png` | The Pi image's screen background (the kernel boot logo is `pi-image/splash.tga`) |
| `NOTES.md` | The session handoff |

## Tooling

- Node 22, Yarn 4 through corepack (`packageManager: yarn@4.9.2`, `nodeLinker: node-modules`),
  TypeScript. Run everything from `app/`.
- `yarn dev`: the app from source with the admin in Vite's dev mode. A checkout is never a
  managed install: its update manager is off.
- `yarn build`: `tsup` bundles `app.ts` and `supervisor.ts` into `dist/`, `vite build` builds
  the admin, `scripts/assembleDist.ts` copies the assets and bundles the view client.
  `yarn serve` runs the build under the supervisor.
- `yarn typecheck` (both TypeScript projects), `yarn check` (the assert-based `*.check.ts`
  files; there is no test framework), `yarn lint` (ESLint; informational in CI).
- `yarn e2e:update`: the update system end to end against a local fake GitHub (about 15 min).

## Branches

- `main`: what is released. Tags (`vX.Y.Z`) sit on `main`.
- `dev`: the current release line (3.3.x). Only fixes for that line and the release itself.
- `next`: new features for the next minor release. Fixes on `dev` are merged forward into
  `next`; `next` goes back into `dev` only when its release is ready.

## Where a box keeps its state

A managed install (installer or Pi image) is one directory: `current` (the active release tag),
`releases/<tag>/` (each installed release), `releases/pending.json` (an unconfirmed update),
`config/config.yaml`, `db/database.db`, `logs/webkontrol.log`, `puppeteer/` (the browser cache)
and `supervisor.js`. On the Pi image that directory is `/opt/webkontrol`.
