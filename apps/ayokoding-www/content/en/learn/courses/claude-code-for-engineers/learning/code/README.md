## Example code for claude-code-for-engineers

One folder per worked example: `ex-NN-<slug>/` holds `example.py`, its `run.yaml` (`toolchain: python`, standard library only), and the recorded output under `expected/`. Every unit is deterministic: no network, no clock reads, no random seeds, fixed environment facts only.

The `example.py` files are fixture shims of the Claude Code CLI surface verified against release 2.1.304 on 2026-10-20. Each file is self-contained and heavily annotated in the `# =>` notation; the lesson pages embed every file byte-identically. Shell invocations shown in lessons are the real `claude` commands each shim stands in for; they carry the illustration marker because no live binary runs in the harness.
