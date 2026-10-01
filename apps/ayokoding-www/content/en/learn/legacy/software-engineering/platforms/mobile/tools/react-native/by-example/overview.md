---
title: "Overview"
weight: 10000000
date: 2026-04-29T00:00:00+07:00
draft: false
description: "Learn React Native through 85 heavily annotated examples covering Expo SDK 55, New Architecture, navigation, animations, native modules, and production deployment"
tags: ["react-native", "expo", "mobile", "ios", "android", "by-example", "typescript"]
---

**Want to learn React Native through code?** This by-example tutorial provides 85 heavily annotated examples covering 95% of React Native + Expo. Master mobile development idioms, New Architecture patterns, and production deployment through working code rather than lengthy explanations.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the React Native concept
2. **How it works** - A focused, heavily commented code example
3. **Key Takeaway** - A pattern summary highlighting the key takeaway
4. **Why It Matters** - Production context, when to use, deeper significance

This approach works best when you already understand programming fundamentals and have some JavaScript or TypeScript experience. You learn React Native's component model, New Architecture, Expo Router, and native module system by studying real code rather than theoretical descriptions.

## What Is React Native?

React Native is a **framework for building native mobile applications** using React and TypeScript. Unlike web-targeted React, React Native compiles to native UI components on iOS and Android. Key distinctions:

- **Truly native**: UI components map to platform-native controls (UIView on iOS, View on Android), not web views
- **New Architecture (mandatory since 0.82)**: Fabric renderer, JSI, TurboModules, and Codegen provide high-performance native interop without the legacy bridge
- **Expo SDK**: Managed workflow providing pre-built native modules, EAS Build/Update/Submit, and a curated SDK for common device APIs
- **Cross-platform**: One TypeScript codebase targeting iOS, Android, and web (via Expo)
- **Flexbox by default**: Layout uses CSS Flexbox but with `flexDirection: 'column'` as default (opposite of web's `'row'`)

## Version Baseline

This tutorial targets:

- **React Native 0.85.x** (stable, April 2026) — New Architecture mandatory, legacy bridge permanently removed
- **Expo SDK 55** (February 2026) — New Architecture mandatory, React 19.2, Expo Router 55
- **React Navigation 7.2.2** — Static API, Screen Preloading
- **TypeScript 5.x** — strict mode throughout
- **Node.js 20.19.4+ / 22 / 24+**

## Learning Path

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
  accTitle: Learning Path
  accDescr: Graph with 5 nodes and 4 connections. Nodes: Beginner Core RN Concepts Examples 1-28, Intermediate State, Animations, Navigation Examples 29-56, Advanced Native Modules, Performance, CI Examples 57-85, 0 No RN Knowledge, 95 Production Mastery. Connections: Beginner Core RN Concepts Examples 1-28 to Intermediate State, Animations, Navigation Examples 29-56, Intermediate State, Animations, Navigation Examples 29-56 to Advanced Native Modules, Performance, CI Examples 57-85, 0 No RN Knowledge to Beginner Core RN Concepts Examples 1-28, Advanced Native Modules, Performance, CI Examples 57-85 to 95 Production Mastery.
  A["Beginner<br/>Core RN Concepts<br/>Examples 1-28"] --> B["Intermediate<br/>State, Animations,<br/>Navigation<br/>Examples 29-56"]
  B --> C["Advanced<br/>Native Modules,<br/>Performance, CI<br/>Examples 57-85"]
  D["0%<br/>No RN Knowledge"] -.-> A
  C -.-> E["95%<br/>Production Mastery"]

  classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  class A pal-0173B2
  classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
  class B pal-DE8F05
  classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  class C pal-029E73
  classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
  class D pal-CC78BC
  class E pal-029E73
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Coverage Philosophy: 95% Through 85 Examples

The **95% coverage** means you understand React Native deeply enough to build and ship production applications. The 85 examples are organized progressively:

- **Beginner (Examples 1-28)**: Foundation — project setup, core components, layout, navigation basics, local persistence
- **Intermediate (Examples 29-56)**: Production patterns — animations, gestures, state management, camera, sensors, forms
- **Advanced (Examples 57-85)**: Mastery — native modules, performance profiling, testing, EAS, CI/CD, production checklist

Together, these examples cover **95% of what you will use** in production React Native applications.

## Annotation Density: 1-2.25 Comments Per Code Line

All examples maintain **1-2.25 comment lines per code line PER EXAMPLE** to ensure deep understanding.

**What this means**:

- Simple lines get 1 annotation explaining purpose or result
- Complex lines get 2+ annotations explaining behavior, state changes, and side effects
- Use `// =>` notation to show expected values, outputs, or state changes

**Example**:

```typescript
import { View, Text, StyleSheet } from "react-native"; // => core RN components
// => no DOM, maps to native widgets

const styles = StyleSheet.create({
  // => creates optimized StyleSheet
  container: {
    // => named style object
    flex: 1, // => fills all available space
    flexDirection: "column", // => COLUMN is the RN default (NOT 'row')
    justifyContent: "center", // => centers children vertically
    alignItems: "center", // => centers children horizontally
  },
});
```

This density ensures each example is self-contained and fully comprehensible without external documentation.

## New Architecture: Why It Matters

Since React Native 0.82, the **legacy bridge is permanently removed**. Every example in this tutorial assumes the New Architecture:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
  accTitle: New Architecture: Why It Matters
  accDescr: Graph with 5 nodes and 4 connections. Nodes: JavaScript Thread React /Business Logic, Native Thread iOS / Android, Renderer Yoga / CSS Flexbox, Native Modules Camera, Storage, GPS, TypeScript Spec Build-time generation. Connections: JavaScript Thread React /Business Logic to Native Thread iOS / Android (JSI - direct C++ refs), Native Thread iOS / Android to Renderer Yoga / CSS Flexbox (Fabric - sync layout), JavaScript Thread React /Business Logic to Native Modules Camera, Storage, GPS (TurboModules - lazy load), Native Modules Camera, Storage, GPS to TypeScript Spec Build-time generation (Codegen - type-safe glue).
  JS["JavaScript Thread<br/>React /Business<br/>Logic"] -->|JSI - direct C++<br/>refs| Native["Native Thread<br/>iOS / Android"]
  Native -->|Fabric - sync layout| Render["Renderer<br/>Yoga / CSS Flexbox"]
  JS -->|TurboModules - lazy<br/>load| Mods["Native Modules<br/>Camera, Storage, GPS"]
  Mods -->|Codegen - type-safe<br/>glue| Spec["TypeScript Spec<br/>Build-time<br/>generation"]

  classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
  class JS pal-0173B2
  classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
  class Native pal-DE8F05
  classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
  class Render pal-029E73
  classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
  class Mods pal-CC78BC
  classDef pal-CA9161 fill:#CA9161,stroke:#000000,color:#000000
  class Spec pal-CA9161
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

- **JSI (JavaScript Interface)**: Direct C++ references from JS — no JSON serialization, sub-millisecond interop
- **Fabric**: C++ shared rendering core enabling synchronous layout and React 18 concurrent features
- **TurboModules**: Lazy-loading native modules (load only when first accessed)
- **Codegen**: Build-time TypeScript spec → type-safe native glue, caught at compile time not runtime

## What Is Covered

### Foundation (Beginner)

- **Project setup**: Expo CLI, project structure, TypeScript config, path aliases
- **Core components**: View, Text, Image, TextInput, ScrollView, FlatList, SectionList
- **Layout**: Flexbox (column-default), gap/rowGap/columnGap, StyleSheet.create()
- **Navigation**: Expo Router file-based routing, Stack, Tabs, dynamic routes
- **Local data**: AsyncStorage, expo-font, expo-image, push notification setup

### Production Patterns (Intermediate)

- **Animations**: useAnimatedValue (RN 0.85), Reanimated 4, layout prop animation
- **Gestures**: react-native-gesture-handler 2.31.1, Pan, Tap, combined gestures
- **State management**: TanStack Query 5, Zustand 5, MMKV 4 synchronous storage
- **Device APIs**: Camera, location, sensors, haptics, image picker
- **Forms and navigation**: react-hook-form + zod, Drawer, auth guard, i18n

### Mastery (Advanced)

- **Native modules**: Nitro Modules, TurboModules + Codegen, Fabric custom views
- **VisionCamera V5**: Constraints API, frame processors (V5 breaks V4 Formats API)
- **Graphics**: React Native Skia, Reanimated shared element transitions
- **Performance**: Hermes profiler, Metro tree shaking, FlatList/FlashList tuning
- **Testing**: @react-native/jest-preset (extracted in RN 0.85), Detox E2E
- **Deployment**: EAS Build/Update/Submit, Fastlane, GitHub Actions CI, production checklist

## What Is NOT Covered

- **Advanced TypeScript internals**: Deep type system unrelated to React Native
- **Web-specific React**: DOM patterns, browser APIs, CSS-in-JS for web
- **Game development**: Unity, Unreal, game loop patterns
- **Machine learning inference**: On-device ML (separate tutorial)
- **Platform-specific Swift/Kotlin in depth**: Covered only as context for native module examples

For these topics, see dedicated tutorials and platform documentation.

## Prerequisites

### Required

- **JavaScript ES6+**: Arrow functions, destructuring, spread/rest, async/await
- **TypeScript basics**: Types, interfaces, generics, type inference
- **React fundamentals**: Components, props, state, hooks (useState, useEffect)
- **Programming experience**: You have built applications before

### Recommended

- **npm/npx basics**: Package installation, running scripts
- **Terminal familiarity**: Navigation, running commands
- **Mobile concepts**: iOS/Android development model awareness (helpful but not required)

### Not Required

- **React Native experience**: This guide assumes you are new to RN
- **Native development (Swift/Kotlin)**: Not needed for Expo managed workflow
- **Xcode/Android Studio**: Not required for Expo Go development

## Key Differences from Web React

Understanding these differences prevents the most common mistakes:

| Concept               | Web React          | React Native                                                         |
| --------------------- | ------------------ | -------------------------------------------------------------------- |
| Default flexDirection | `'row'`            | `'column'`                                                           |
| Base layout container | `<div>`            | `<View>`                                                             |
| Text rendering        | Any HTML element   | Must use `<Text>`                                                    |
| Styling               | CSS files / inline | `StyleSheet.create()` only                                           |
| Navigation            | React Router / URL | Expo Router / React Navigation                                       |
| Storage               | localStorage       | AsyncStorage / MMKV                                                  |
| Absolute fill         | N/A                | `StyleSheet.absoluteFill` (NOT absoluteFillObject — removed in 0.85) |

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to React Native?** Start with Beginner (Example 1)
- **React/web developer?** Skim Beginner, start Intermediate (Example 29)
- **Building a specific feature?** Jump to the relevant example group

### 2. Read the Example

Each example has five parts:

- **Explanation** (1-3 sentences): What React Native concept, why it exists, when to use it
- **Code** (heavily commented): Working TypeScript code showing the pattern
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production context and deeper significance

### 3. Run the Code

Create a test Expo project and run each example:

```bash
npx create-expo-app MyApp --template blank-typescript  # => creates managed Expo project
cd MyApp                                                # => enter project directory
npx expo start                                          # => start Metro bundler
# Scan QR code with Expo Go app on your phone
# Or press 'i' for iOS Simulator / 'a' for Android Emulator
```

### 4. Modify and Experiment

Change props, break animations, swap gesture handlers. Experimentation builds intuition faster than reading.

## Ready to Start?

Choose your learning path:

- **Beginner** - Start here if new to React Native. Build foundation understanding through 28 core examples covering project setup through push notifications.
- **Intermediate** - Jump here if you know RN basics. Master production patterns through 28 examples covering animations, state management, and device APIs.
- **Advanced** - Expert mastery through 29 examples covering native modules, VisionCamera, performance profiling, testing, and production deployment.

## Examples by Level

### Beginner (Examples 1–28)

- [Example 1: New Expo Project Structure](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-1-new-expo-project-structure)
- [Example 2: TypeScript Configuration for React Native](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-2-typescript-configuration-for-react-native)
- [Example 3: View and Text — Base Building Blocks](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-3-view-and-text--base-building-blocks)
- [Example 4: StyleSheet.create() — Typed Styles and CSS Differences](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-4-stylesheetcreate--typed-styles-and-css-differences)
- [Example 5: Flexbox Layout — Column-Default and Axis Controls](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-5-flexbox-layout--column-default-and-axis-controls)
- [Example 6: gap, rowGap, columnGap in Flexbox](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-6-gap-rowgap-columngap-in-flexbox)
- [Example 7: Image and ImageBackground](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-7-image-and-imagebackground)
- [Example 8: TextInput — Controlled Inputs](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-8-textinput--controlled-inputs)
- [Example 9: TouchableOpacity vs Pressable](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-9-touchableopacity-vs-pressable)
- [Example 10: ScrollView — Simple Scrollable Content](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-10-scrollview--simple-scrollable-content)
- [Example 11: FlatList — Virtualized Lists](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-11-flatlist--virtualized-lists)
- [Example 12: SectionList — Grouped Data with Headers](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-12-sectionlist--grouped-data-with-headers)
- [Example 13: Modal — Overlay Dialogs](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-13-modal--overlay-dialogs)
- [Example 14: ActivityIndicator and Loading States](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-14-activityindicator-and-loading-states)
- [Example 15: Alert and Platform Dialogs](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-15-alert-and-platform-dialogs)
- [Example 16: Platform-Specific Code](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-16-platform-specific-code)
- [Example 17: Safe Area — Handling Notches and Home Bars](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-17-safe-area--handling-notches-and-home-bars)
- [Example 18: File-Based Routing with Expo Router](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-18-file-based-routing-with-expo-router)
- [Example 19: Stack Navigation — Headers and Navigation Options](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-19-stack-navigation--headers-and-navigation-options)
- [Example 20: Tab Navigation with Expo Router](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-20-tab-navigation-with-expo-router)
- [Example 21: Dynamic Routes — Parameterized URLs](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-21-dynamic-routes--parameterized-urls)
- [Example 22: Passing Data Between Screens](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-22-passing-data-between-screens)
- [Example 23: useState and useEffect — Mobile Lifecycle](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-23-usestate-and-useeffect--mobile-lifecycle)
- [Example 24: AsyncStorage — Simple Key-Value Persistence](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-24-asyncstorage--simple-key-value-persistence)
- [Example 25: expo-font — Loading Custom Fonts](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-25-expo-font--loading-custom-fonts)
- [Example 26: expo-image — Optimized Image with Caching](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-26-expo-image--optimized-image-with-caching)
- [Example 27: Icons with @expo/vector-icons](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-27-icons-with-expovector-icons)
- [Example 28: Push Notifications Setup with expo-notifications](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/beginner#example-28-push-notifications-setup-with-expo-notifications)

### Intermediate (Examples 29–56)

- [Example 29: useAnimatedValue — The New RN 0.85 Hook](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-29-useanimatedvalue--the-new-rn-085-hook)
- [Example 30: Animating Layout Props Natively — RN 0.85 Shared Animation Backend](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-30-animating-layout-props-natively--rn-085-shared-animation-backend)
- [Example 31: Reanimated 4 — useSharedValue, useAnimatedStyle, withTiming, withSpring](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-31-reanimated-4--usesharedvalue-useanimatedstyle-withtiming-withspring)
- [Example 32: Reanimated 4 Worklets — UI Thread Logic](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-32-reanimated-4-worklets--ui-thread-logic)
- [Example 33: Gesture Handling — Pan, Tap, GestureDetector](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-33-gesture-handling--pan-tap-gesturedetector)
- [Example 34: Combined Gestures — Simultaneous, Exclusive, Race](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-34-combined-gestures--simultaneous-exclusive-race)
- [Example 35: FlashList — Drop-in FlatList Replacement](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-35-flashlist--drop-in-flatlist-replacement)
- [Example 36: Infinite Scroll — FlashList + TanStack Query](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-36-infinite-scroll--flashlist--tanstack-query)
- [Example 37: TanStack Query — useQuery, useMutation](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-37-tanstack-query--usequery-usemutation)
- [Example 38: TanStack Query — Focus and Window Management](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-38-tanstack-query--focus-and-window-management)
- [Example 39: Zustand — Global Store with TypeScript](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-39-zustand--global-store-with-typescript)
- [Example 40: Zustand with Persistence — MMKV Storage Adapter](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-40-zustand-with-persistence--mmkv-storage-adapter)
- [Example 41: MMKV — Synchronous Key-Value Storage](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-41-mmkv--synchronous-key-value-storage)
- [Example 42: Camera with expo-camera](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-42-camera-with-expo-camera)
- [Example 43: Push Notifications — Handling Delivery](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-43-push-notifications--handling-delivery)
- [Example 44: Deep Linking — URL Schemes and Universal Links](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-44-deep-linking--url-schemes-and-universal-links)
- [Example 45: Device Sensors — Accelerometer, Gyroscope](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-45-device-sensors--accelerometer-gyroscope)
- [Example 46: Location Services](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-46-location-services)
- [Example 47: Haptics — Tactile Feedback](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-47-haptics--tactile-feedback)
- [Example 48: Keyboard Avoidance](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-48-keyboard-avoidance)
- [Example 49: Custom Hooks — useFetch, useDebounce, usePrevious](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-49-custom-hooks--usefetch-usedebounce-useprevious)
- [Example 50: Form Handling — react-hook-form with zod Validation](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-50-form-handling--react-hook-form-with-zod-validation)
- [Example 51: Drawer Navigation in Expo Router](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-51-drawer-navigation-in-expo-router)
- [Example 52: Auth Flow — Protected Routes with Expo Router](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-52-auth-flow--protected-routes-with-expo-router)
- [Example 53: expo-sqlite — Local SQLite Database](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-53-expo-sqlite--local-sqlite-database)
- [Example 54: i18n — Internationalization with i18next](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-54-i18n--internationalization-with-i18next)
- [Example 55: Image Picking — expo-image-picker and expo-media-library](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-55-image-picking--expo-image-picker-and-expo-media-library)
- [Example 56: Background Tasks — expo-background-fetch](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/intermediate#example-56-background-tasks--expo-background-fetch)

### Advanced (Examples 57–85)

- [Example 57: Nitro Modules — Custom Native Module](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-57-nitro-modules--custom-native-module)
- [Example 58: TurboModules + Codegen — The Standard Native Module Path](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-58-turbomodules--codegen--the-standard-native-module-path)
- [Example 59: Fabric Custom Native View — Nitro View Spec](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-59-fabric-custom-native-view--nitro-view-spec)
- [Example 60: VisionCamera V5 — Constraints API](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-60-visioncamera-v5--constraints-api)
- [Example 61: VisionCamera Frame Processors](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-61-visioncamera-frame-processors)
- [Example 62: React Native Skia — Canvas, Path, Paint](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-62-react-native-skia--canvas-path-paint)
- [Example 63: Skia + Reanimated — Animating Canvas Values](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-63-skia--reanimated--animating-canvas-values)
- [Example 64: Shared Element Transitions — Hero Animations](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-64-shared-element-transitions--hero-animations)
- [Example 65: Layout Animations — Entering, Exiting, Layout](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-65-layout-animations--entering-exiting-layout)
- [Example 66: WatermelonDB — Reactive SQLite ORM](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-66-watermelondb--reactive-sqlite-orm)
- [Example 67: Offline-First Architecture](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-67-offline-first-architecture)
- [Example 68: Performance Profiling with Hermes and React DevTools](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-68-performance-profiling-with-hermes-and-react-devtools)
- [Example 69: Metro Bundle Optimization](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-69-metro-bundle-optimization)
- [Example 70: FlatList/FlashList Performance Tuning](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-70-flatlistflashlist-performance-tuning)
- [Example 71: Memoization — When and When Not to Use](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-71-memoization--when-and-when-not-to-use)
- [Example 72: Hermes Bytecode and Startup Optimization](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-72-hermes-bytecode-and-startup-optimization)
- [Example 73: Unit Testing — @react-native/jest-preset](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-73-unit-testing--react-nativejest-preset)
- [Example 74: Mocking Native Modules in Jest](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-74-mocking-native-modules-in-jest)
- [Example 75: E2E Testing with Detox](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-75-e2e-testing-with-detox)
- [Example 76: EAS Build — Build Configuration](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-76-eas-build--build-configuration)
- [Example 77: EAS Update — Over-the-Air Updates](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-77-eas-update--over-the-air-updates)
- [Example 78: EAS Submit — Automated App Store Submission](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-78-eas-submit--automated-app-store-submission)
- [Example 79: Fastlane for Bare React Native](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-79-fastlane-for-bare-react-native)
- [Example 80: GitHub Actions CI Pipeline](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-80-github-actions-ci-pipeline)
- [Example 81: App Store and Play Store Release](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-81-app-store-and-play-store-release)
- [Example 82: Sentry — Crash Reporting and Performance Monitoring](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-82-sentry--crash-reporting-and-performance-monitoring)
- [Example 83: Expo Modules API — Swift/Kotlin Native Module](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-83-expo-modules-api--swiftkotlin-native-module)
- [Example 84: useReducer + useContext — Complex Local State](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-84-usereducer--usecontext--complex-local-state)
- [Example 85: Production Checklist](/en/learn/software-engineering/platforms/mobile/tools/react-native/by-example/advanced#example-85-production-checklist)
