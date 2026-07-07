import { LifeCycle } from "./src/orchestration/LifeCycle";

const lifeCycle = new LifeCycle();

const app = await lifeCycle.construct();
await app.init();
