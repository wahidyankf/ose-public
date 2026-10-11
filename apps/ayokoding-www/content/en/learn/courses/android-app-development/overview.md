---
title: "Overview"
date: 2026-08-03T00:00:00+07:00
draft: false
weight: 1
---

Native Android development is a coordination problem: an activity can be recreated while a user is
editing, a request can finish after a screen disappears, and a device capability can be denied.
This course keeps those platform events from leaking into every composable by putting durable screen
state in a ViewModel and driving UI with unidirectional data flow.

## Prerequisites

- [Just Enough Kotlin](../just-enough-kotlin/learning/overview.md) supplies Kotlin syntax,
  sealed state, and coroutine vocabulary used throughout this course.
- [Frontend Essentials](../frontend-essentials/learning/overview.md) supplies component, state,
  and accessible-interface thinking.
- [47 · Advanced Frontend](../advanced-frontend/learning/overview.md) supplies declarative UI,
  state-management, and optimistic-update foundations.
- Install Android Studio Quail 2 Feature Drop (2026.1.2), a JDK, the Android SDK, and an
  emulator/AVD or device. This course uses that release as its authoring baseline; verify the
  current stable Android tooling before creating a production project. Use Gradle commands such as
  `./gradlew test` and `./gradlew connectedAndroidTest` from an Android project root.

## What you will build

The learning track contains 78 original, annotated Kotlin examples. They progress from the Android
manifest and activity lifecycle through Compose state and Material UI, then into ViewModel-led state,
Room, DataStore, Retrofit, coroutines, Flow, navigation, permissions, configuration survival, and
three complementary test layers. The capstone is a two-screen offline-aware list app with Room,
Retrofit, navigation, configuration-change survival, a local unit test, and a Compose UI test.

## Scope boundary

This course owns native Android application architecture and implementation. It does not re-teach
Kotlin language fundamentals, generic frontend component theory, or Android framework internals.
Those boundaries matter: Kotlin stays in the prerequisite course, while this course applies it to
Android lifecycle, persistence, navigation, and delivery decisions.

Start with the [learning overview](./learning/overview.md), then use the
[drilling track](./drilling/overview.md) to rehearse decisions without looking at the code.

## Read more

- [Guide to app architecture](https://developer.android.com/topic/architecture)
- [Jetpack Compose documentation](https://developer.android.com/develop/ui/compose/documentation)
- [Kotlin overview for Android](https://developer.android.com/kotlin/overview)
