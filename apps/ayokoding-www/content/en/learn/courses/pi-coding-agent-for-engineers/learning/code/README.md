## Example code for pi-coding-agent-for-engineers

One folder per worked example: `ex-NN-<slug>/` holds `main.py`, its `run.yaml` (`toolchain: python`, standard library only), and the recorded output under `expected/`. Every unit is deterministic: no network, no clock reads, no random seeds, fixed environment facts only.

The `main.py` files are fixture shims of the Pi coding agent CLI surface verified against release 1.3.0 on 2026-10-20. Each file is self-contained and heavily annotated in the `# =>` notation; the lesson pages embed every file byte-identically. Shell invocations described in lessons are the real `pi` commands each shim stands in for; no live binary runs in the harness, so no shell fence needs the illustration marker.
