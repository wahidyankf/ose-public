## Example code for playwright-end-to-end-testing

One folder per worked example: `ex-NN-<slug>/` holds `example.ts`, its `run.yaml`
(`toolchain: node`, standard library only), the committed `fixture.html` page it
drives where the lesson needs one, and the recorded output under `expected/`.
Every unit is deterministic: loopback fixture server only, no real network, no
clock reads, no random seeds, fixed environment facts only.

The `example.ts` files are behavior models of the Playwright 1.60.0 API verified
against the 1.60.0 docs on 2026-10-20. Each file is self-contained and heavily
annotated in the `// =>` notation; the lesson pages embed every file
byte-identically. Real Playwright calls shown in lessons are the calls each model
stands in for; no live browser runs in the harness.
