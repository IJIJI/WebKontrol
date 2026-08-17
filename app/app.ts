import { LifeCycle } from "./src/orchestration/LifeCycle";

const lifeCycle = new LifeCycle();

const app = await lifeCycle.construct();
await app.init();

// Close deliberately on shutdown so puppet browsers are told apart from crashes and do
// not linger when the process is stopped.
let closing = false;
function beginShutdown(): void {
  if (closing) return;
  closing = true;
  void app.close().finally(() => process.exit(0));
}

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
