## Example code for github-actions-and-gh-cli

One folder per worked example: `ex-NN-<slug>/` holds `check.py`, its `run.yaml` (`toolchain: python`, standard library only), the file under test (`workflow.yaml`, `action.yaml`, `script.sh`, or a JSON fixture), and the recorded output under `expected/`. Every unit is deterministic: YAML and JSON fixtures are committed beside the checker, no network, no clock reads, no random seeds.

The `check.py` files are offline validators and fixture simulators verified against the vendor docs on 2026-10-20. Each file is self-contained and heavily annotated in the `# =>` notation; the lesson pages embed every file byte-identically. Shell invocations shown in lessons are the real `gh` and `git` commands each checker stands in for; they carry the illustration marker because no live repository runs in the harness.
