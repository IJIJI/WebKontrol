import { LifeCycle } from "./src/orchestration/LifeCycle";

const lifeCycle = new LifeCycle();

const app = await lifeCycle.construct();
await app.init();

// Close deliberately on shutdown so puppet browsers are told apart from crashes and do
// not linger when the process is stopped. A second signal forces exit for a hung close.
let closing = false;
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    if (closing) process.exit(1);
    closing = true;
    void app.close().finally(() => process.exit(0));
  });
}
