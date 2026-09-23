---
description: "Phase 10 (full scope only): install Flutter (bundles Dart) so dart format can format the Dart course corpora."
when_to_use: "Use when setting up Dart/Flutter under full scope."
---

# Phase 10: Dart/Flutter Ecosystem (Sequential)

**Condition**: `{input.scope} == full`

Required for: the `format-staged` gate, which runs `dart format` over staged `*.dart` files. No Nx
project in this workspace is a Dart project today — the Dart sources are AyoKoding course corpora
under `apps/ayokoding-www/content/`. `./rhino toolchain validate` checks `dart`, so it must be on
`PATH` for a clean doctor run.

## 10.1 Install Flutter (includes Dart)

```bash
# macOS
brew install --cask flutter

# Or manual install: https://docs.flutter.dev/get-started/install
```

Flutter bundles the Dart SDK. The Flutter version this repository pins is in
[`.fvmrc`](../../../../.fvmrc); CI installs that same version.

**Success criteria**: `flutter --version` and `dart --version` both return version strings.

## 10.2 Enable Flutter Web

```bash
flutter config --enable-web
flutter doctor
```

Enabling web keeps a local toolchain matching CI's Flutter setup, so a Dart or Flutter project added
later needs no extra local step.

**Success criteria**: `flutter doctor` shows no critical issues for web development.
