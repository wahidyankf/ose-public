---
title: "Overview"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 1
---

Flutter lets a team ship one deliberately designed interface to mobile and desktop from a Dart
codebase. Its renderer draws the interface itself, so shared UI is a concrete engineering choice:
it reduces duplicated feature work while making fidelity, binary size, startup, and platform edges
visible trade-offs.

## Prerequisites

- Complete [Just Enough Dart](../just-enough-dart/learning/overview.md). It owns Dart syntax,
  null safety, classes, mixins, `Future`, and `Stream`; this course applies those tools in Flutter
  instead of teaching them again.
- Complete [Frontend Essentials](../frontend-essentials/learning/overview.md) for declarative UI,
  composition, and layout thinking.
- Install a current stable Flutter SDK, then prepare at least one supported target such as an
  Android emulator, iOS Simulator on macOS, or a desktop runner. Run `flutter --version` to inspect
  the SDK actually installed on your machine.

## What you will build

The learning track has 78 source-matched, annotated examples. They move from widgets and local
state through shared state, navigation, asynchronous UI, persistence, platform boundaries,
adaptive layouts, and Flutter's test tiers. The capstone is a Focus Shelf app: it has two screens,
shared saved-item state, a phone-to-desktop reflow, and an explicit native-capability fallback.

## Scope boundary

This is a Flutter platform course, not a Dart primer and not a catalog of ecosystem packages.
Just Enough Dart owns language mechanics. This course teaches the framework decisions that turn
that language into a cross-platform product; native-only APIs and third-party packages appear only
where the core framework cannot demonstrate the platform boundary or production pattern.

Start with the [learning overview](./learning/overview.md), then use the
[drilling track](./drilling/overview.md) to practise the design choices without looking at a worked
answer.

## Read more

- [Flutter documentation](https://docs.flutter.dev/)
- [Flutter API reference](https://api.flutter.dev/)
- [Flutter testing overview](https://docs.flutter.dev/testing/overview)
