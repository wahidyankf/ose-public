import { ManagedRuntime, Effect } from "effect";
import { makeAppLayer } from "./app.js";
import { loadConfig } from "./config.js";

const main = Effect.gen(function* () {
  const config = yield* loadConfig();
  console.log(`Starting demo-be-tsex on port ${config.port}`);
  const appLayer = makeAppLayer(config.port);
  const runtime = ManagedRuntime.make(appLayer);
  yield* Effect.promise(() => runtime.runPromise(Effect.never));
});

Effect.runPromise(main).catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
