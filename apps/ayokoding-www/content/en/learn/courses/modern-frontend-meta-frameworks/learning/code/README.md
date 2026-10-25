## Example code for modern-frontend-meta-frameworks

One folder per worked example: `ex-NN-<slug>/` holds `main.ts`, its `run.yaml`
(`toolchain: typescript`, standard library only), and the recorded output under `expected/`.
Every unit is deterministic: no network beyond a loopback request the script itself serves,
no clock reads, no random values, fixed fictional facts only.

Every example models the routing, rendering, or data-loading convention of Next.js
(App Router) or TanStack Start as small, runnable TypeScript: route tables, layout
composition, loaders, actions, and caches. NusaMart and every product in this course are
fictional. The lesson pages embed every file byte-identically.
