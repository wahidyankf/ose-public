---
title: "Overview"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 1
---

Native iOS development coordinates a system-managed app lifecycle, declarative UI, observable
screen state, remote and local data, and concurrency. This course keeps those concerns from
spreading through every view: SwiftUI renders state, a view model owns decisions, and services own
changing boundaries.

## Prerequisites

- Complete [Just Enough Swift](../just-enough-swift/learning/overview.md). It supplies Swift
  syntax, optionals, protocols, errors, and the small `async`/`await` vocabulary used here.
- [Frontend Essentials](../frontend-essentials/learning/overview.md) supplies component, state,
  and accessible-interface thinking.
- [Android App Development](../android-app-development/learning/overview.md) supplies the
  platform-lifecycle and declarative-UI comparison this course builds on.
- Use macOS with a current Xcode release, its iOS simulator, and optionally a physical device. Use
  `xcodebuild` for repeatable command-line builds and tests.

## What you will build

The learning track has 78 source-matched, annotated Swift examples. They start with the `App`
entry point and SwiftUI state, then apply Observation, MVVM, `Codable`, `URLSession`, navigation,
permissions, actors, SwiftData, and tests. The capstone is a two-screen Focus List app with an
observable model, injected service, actor cache, persistence, and XCTest/XCUITest coverage.

## Scope boundary

This is an iOS platform course, not a repeat of Swift syntax. The prerequisite owns optionals,
enums, protocols, closures, and basic `async`/`await`; this course applies them to lifecycle,
rendering, platform services, isolation, and delivery. It uses native SDK facilities rather than
third-party frameworks so the ownership boundaries stay inspectable.

App Store submission requirements change. Always confirm the current Xcode and SDK requirement
before a release; an app's deployment target and the SDK used to build a submission are separate
decisions.

Start with the [learning overview](./learning/overview.md), then use the
[drilling track](./drilling/overview.md) to rehearse decisions without looking at the examples.

## Read more

- [SwiftUI documentation](https://developer.apple.com/documentation/swiftui)
- [Swift concurrency documentation](https://developer.apple.com/documentation/swift/concurrency)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
