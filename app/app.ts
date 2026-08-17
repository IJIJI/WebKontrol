import { LifeCycle } from "./src/orchestration/LifeCycle";
import { Logger } from "./src/logging/Logger";

const logger = new Logger(["LIFECYCLE", "GUARD"]);

// Assigned once construction finishes; the guards below can fire before that.
let app: Awaited<ReturnType<LifeCycle["construct"]>> | undefined;

// Close deliberately on shutdown so puppet browsers are told apart from crashes and do
// not linger when the process is stopped.
let closing = false;
function beginShutdown(code = 0): void {
  if (closing) return;
  closing = true;
  if (!app) process.exit(code); // died before construction finished; nothing to close
  void app.close().finally(() => process.exit(code));
}

//* Process-level guards (registered before construction so startup is covered too):
// An appliance must not die because a library fire-and-forgot a rejectable promise.
// Puppeteer's launch-failure cleanup `void`s one that rejects EBUSY while a dying
// Chromium still holds its temp profile (observed after a hibernate wake, 2026-08-17:
// every display went down for a temp-dir unlink). Logged loudly instead of crashing, so
// a genuinely broken async path stays visible; puppet trouble still surfaces through its
// own state machinery either way.
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection (surviving; see app.ts):", reason);
});

// A synchronous throw is different: unknown, possibly corrupt state. Restarting clean is
// the supervisor's job, so close and exit nonzero. The close is best-effort teardown (the
// displays must not be left showing dead kiosks); the deadline bounds how long we trust a
// process that just proved itself wrong.
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception; closing for a clean restart:", error);
  setTimeout(() => process.exit(1), 10_000).unref();
  beginShutdown(1);
});

// Signals keep force-on-repeat: a human hammering Ctrl+C wants out, hung close or not.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    if (closing) process.exit(1);
    beginShutdown();
  });
}

// Supervised: the supervisor asks over IPC, since Windows has no signals it could send.
// Idempotent on purpose, never force: on POSIX a terminal Ctrl+C reaches this process
// through the group AND the supervisor sends the message, and the second trigger must not
// count as hammering.
if (process.send) {
  process.on("message", (message) => {
    if (message === "shutdown") beginShutdown();
  });
}

const lifeCycle = new LifeCycle();
app = await lifeCycle.construct();
await app.init();
