## Example code for python-in-depth

One folder per worked example: `ex-NN-<slug>/` holds `main.py` (plus helper modules or fixtures where the topic needs more than one file), its `run.yaml` (`toolchain: python`, standard library only, no network), and the recorded output under `expected/`. Multi-file units anchor every file in the lesson; single-file units anchor the program and its output. Every unit is deterministic: fixed inputs, no live system reads, no clocks, no timings, no paths or addresses in output, temporary files only in scratch with fixed labels printed.

Testing examples use an in-memory `unittest.TestResult` instead of the text runner so no timing lines pollute the transcript. Concurrency examples join every worker and print ordered results. Kata starters are intentionally imperfect — they exist to be fixed — and only the `after/` solutions run green in the harness.
