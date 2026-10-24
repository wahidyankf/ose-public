## Example code for dart-in-depth

One folder per worked example: `ex-NN-<slug>/` holds the Dart sources, its `run.yaml` (`toolchain: dart`, Dart 3.13.5, standard library only), and the recorded output under `expected/`. Single-file units run with `dart main.dart`; the two multi-file units (part files, export barrel) run their `main.dart` against sibling library files in the same unit. Testing-convention units run `dart main.dart` over assert-based checks with timing normalized out of the transcript; the toolchain chapter gates two units on `dart format --set-exit-if-changed` and `dart analyze` where the lesson is about the tool itself. No example needs the network, the clock, or random seeds: fixed inputs keep every run byte-deterministic. The pinned Dart 3.13.5 toolchain in `apps/ayokoding-cli` is the single source of truth for any version-specific syntax or API.

The `.dart` files are heavily annotated in the `// =>` notation. The lesson pages embed every file byte-identically.
