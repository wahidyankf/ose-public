## Example code for java-in-depth

One folder per worked example: `ex-NN-<slug>/` holds `Main.java` (plus helper files or fixtures where the topic needs more than one file), its `run.yaml` (`toolchain: java`, standard library only, no network), and the recorded output under `expected/`. Multi-file units anchor every file in the lesson; single-file units anchor the program and its output. Every unit is deterministic: fixed inputs, no live system reads, no clocks, no timings, no paths or addresses in output, temporary files only in scratch with fixed labels printed.

Testing examples use `java -ea` assertions and a hand-rolled check vocabulary printing PASS lines so no timing lines pollute the transcript. Concurrency examples join every worker and print ordered results. The lint example compiles under `-Xlint:all -Werror`. Kata starters are intentionally imperfect -- they exist to be fixed -- and only the `after/` solutions run green in the harness.
