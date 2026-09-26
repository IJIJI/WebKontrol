# Architecture

Paths are relative to `app/`. Only what the code shows is written here; when a file and this
document disagree, the file wins and this document gets fixed.

## Processes

```
supervisor.ts   restarts the app on any exit it did not ask for (shared backoff curve);
                confirms or rolls back an update through releases/pending.json
  └─ app.ts     process guards (unhandledRejection logs and survives, uncaughtException
                closes and exits 1 within 10 s), then LifeCycle
```

Both write `logs/webkontrol.log`. The supervisor only runs built code; `yarn dev` runs `app.ts`
directly so a crash stays visible.

## Start-up

`src/orchestration/LifeCycle.ts` reads the config (`ConfigManager`: `config.local.yaml` replaces
`config.yaml` when present, never merged; validated by `orchestration/config/schema.ts`), builds a puppet per
configured entry through `PuppetFactory`, and wires the managers into `AppCore`.

`src/orchestration/AppCore.ts` initialises them in this order: system, updates, views (the
orchestrator resolves assignments into targets, so views come first), the view server's
bundle, the orchestrator's view context, the UI settings, the view routes and the handlers,
the web server, the puppets. Last, on a fresh database,
it seeds the default view (`src/views/defaultView.ts`). AppCore also keeps the one
`WebServerState` object in sync with every manager's events and hands it to the web server.

## Puppets (`src/puppet/`, `src/orchestration/puppet/`)

- `AbstractPuppet.ts`: one display's lifecycle and state (connection state, navigation state,
  runtime, appearance), navigation with superseding (the newest call owns the record), crash
  repair, the fallback page.
- `puppeteer/PuppeteerPuppet.ts`: the Chromium implementation. `--start-fullscreen` and
  `--test-type` always; `--kiosk` without a configured `window`,
  `--window-position`/`--window-size` with one. `puppeteer/failures.ts` classifies a failed navigation.
- `fallbackPage.ts`: the locally rendered page shown when a target fails to load (clock, the
  failure, a countdown); written into the page, so it needs neither server nor network.
- `pacing.ts`: the one backoff curve (`RetryHandler`) used by navigation retries, crash repair
  and the update check.
- `orchestration/puppet/PuppetOrchestrator.ts`: owns the puppets and the orchestrator runtime:
  `assignments` (puppet to view) and `default_view` (what a puppet without an assignment
  shows; blank when unset). Resolves a puppet's view into a navigation target, retries failed
  navigations, re-navigates on view changes and removals.

## Views and blocks (`src/views/`)

- `ViewManager.ts`: the view collection (the model), its storage and runtime; emits
  `view_added`, `view_updated`, `view_removed`.
- `views/UrlView.ts`: the puppet is redirected to the URL (no iframe, so pages that forbid
  embedding still load). `views/BlockView.ts`: a page rendered from a block tree.
- `ViewServer.ts`: the transport. `GET /view/:key` (a redirect or the block view host page),
  the SSE stream `/view/:key/stream` (config pushed on every change, so edits appear without
  a reload), `/viewclient/main.js`, `/viewclient/view.css`, and `/viewclient/fonts/:file` (an
  allowlist; the admin loads its fonts from the same route).
- `client/`: the browser renderer for block views, React-free, built on Lit and bundled with
  esbuild by `build.ts` (at build time in production, at start-up from source).
  `client/view.css` is the block stylesheet.
- `blocks/`: the block system. `types/config.ts` (`defineBlock`, `createNamespace`),
  `registry.ts` (`BlockTypeRegistry`, per namespace), `resolver.ts` (validates and resolves a
  stored tree; a block that fails renders as a visible broken block), `render.ts` (the render
  core: every block is a slot wrapping a styled box), `styles.ts`, `clock.ts`, `dualTone.ts`,
  `fitScale.ts`, `phpDate.ts`. The built-in blocks are in
  `blocks/namespaces/webkontrol/blocks.schema.ts`: website, text, container, grid, stack, free
  form, spacer, divider, image, date and time.

## Web server (`src/webServer/`)

`WebServer.ts` is Express with vite-express for the admin. `/api/state` is an SSE stream: the
full state (`event: data`) on connect and on every change, plus a ping every
`web.sse.ping_interval` ms. Mutations are plain routes under `/api` that call the handlers
AppCore registers (`model.ts`, `WebServerMutationHandlers`). Components register their own
routes through `RouteRegistrar` before `start()`.

## Updates (`src/system/update/`)

- `GitHubReleases.ts`: what is published (the releases API; `update.api_base` in the config
  points it elsewhere for tests).
- `UpdateManager.ts`: whether and when. Checks at start and daily; a failed check retries on
  `RETRY_PACING` (4 min doubling to 16 h). Announces only GitHub's `latest` when newer.
  `applyGate` refuses an apply that would lose data. Dormant in a git checkout.
- `plan.ts` (the pure "what"), `UpdateRunner.ts` (the disk work: download, install, flip
  `current`, snapshot the database, write `pending.json`), `version.ts` (tag ordering),
  `schema.ts` (the journal of the last apply).

## Storage (`src/storage/`)

`CoreDatabase.ts`: SQLite through better-sqlite3 and Drizzle at `db/database.db`. Tables are
created from `schema.ts`; there is one table, `settings` (`domain`, `type`, `key`, `value`).
`isFresh` says the database was created by this process. `migrations.ts` is the forward-only
chain, keyed by `user_version`; fresh databases skip it. `stores/` hold one store per owner
(puppets, orchestrator, views, system, UI, updates).

## Admin (`ui/src/`)

React with react-router (data router), Vite, Less. `context/ApiStateContext.tsx` holds the
state stream: it reconnects every 2 s after a loss and reloads the page when the running
version changes, and it maps the wire state into `UiPuppetState` and `UiViewState` with their
mutations. Pages are in `pages/`; the block editor is `components/blockTree/`; settings
fields are `components/settings/` (their layout follows `SettingWidth`: wide, compact, or
auto, which is wide until the field itself is narrower than 400 px).
