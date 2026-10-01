---
title: "Overview"
weight: 10000000
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Learn Flutter Web through 80 production-ready annotated examples covering widgets, state management, HTTP, animations, routing, and deployment - achieving 95% framework mastery"
tags: ["flutter", "dart", "flutter-web", "tutorial", "by-example", "overview", "code-first"]
---

## Want to Master Flutter Web Through Working Code?

This guide teaches you Flutter Web through **80 production-ready code examples** rather than lengthy explanations. If you are an experienced developer switching to Flutter Web, or want to deepen your framework mastery, you will build intuition through actual working patterns annotated with `// =>` comments that explain values, states, and side effects at every step.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the Flutter concept
2. **How it works** - A focused, heavily commented code example with `// =>` annotations
3. **Why it matters** - A pattern summary highlighting the key takeaway and production relevance

This approach works best when you already understand programming fundamentals and have experience with at least one programming language. You learn Flutter's idioms, widget tree model, and best practices by studying real code rather than theoretical descriptions.

## What Is Flutter Web?

Flutter Web is **Google's UI toolkit for building web applications** using the Dart programming language. It renders your application using either the HTML renderer (DOM-based) or the CanvasKit renderer (WebAssembly + Skia). Key distinctions:

- **Not React or Angular**: Flutter uses a widget tree model where everything is a widget composed together, not a template system with two-way data binding
- **Compiled Dart**: Your Dart code compiles to JavaScript (dart2js) or WebAssembly (dart2wasm), not interpreted at runtime
- **Single codebase**: The same Flutter application can target web, Android, iOS, desktop - with platform-specific adaptations
- **Pixel-perfect rendering**: CanvasKit renders consistently across all browsers by drawing directly to a `<canvas>` element
- **Modern Flutter 3.22+**: Includes Impeller renderer support experiments, improved WASM compilation, Material 3 defaults, and refined web platform integration

## Learning Path

```mermaid
graph TD
  accTitle: Learning Path
  accDescr: Graph with 5 nodes and 4 connections. Nodes: Beginner Core Flutter Concepts Examples 1-27, Intermediate Production Patterns Examples 28-55, Advanced Platform & Scale Examples 56-80, 0 No Flutter Knowledge, 95 Framework Mastery. Connections: Beginner Core Flutter Concepts Examples 1-27 to Intermediate Production Patterns Examples 28-55, Intermediate Production Patterns Examples 28-55 to Advanced Platform & Scale Examples 56-80, 0 No Flutter Knowledge to Beginner Core Flutter Concepts Examples 1-27, Advanced Platform & Scale Examples 56-80 to 95 Framework Mastery.
  A["Beginner<br/>Core Flutter<br/>Concepts<br/>Examples 1-27"] --> B["Intermediate<br/>Production Patterns<br/>Examples 28-55"]
  B --> C["Advanced<br/>Platform & Scale<br/>Examples 56-80"]
  D["0%<br/>No Flutter Knowledge"] -.-> A
  C -.-> E["95%<br/>Framework Mastery"]

  classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
  class A pal-0173B2
  classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
  class B pal-DE8F05
  classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
  class C pal-029E73
  classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
  class D pal-CC78BC
  class E pal-029E73
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Coverage Philosophy: 95% Through 80 Examples

The **95% coverage** means you will understand Flutter Web deeply enough to build production applications with confidence. It does not mean you will know every edge case or advanced feature - those come with experience building real applications.

The 80 examples are organized progressively:

- **Beginner (Examples 1-27)**: Foundation concepts covering MaterialApp, Scaffold, core widgets, layout, StatelessWidget, StatefulWidget, setState, buttons, text fields, forms, images, lists, grids, navigation, AppBar, Drawer, and BottomNavigationBar
- **Intermediate (Examples 28-55)**: Production patterns covering InheritedWidget, Provider, Riverpod, HTTP networking, JSON parsing, FutureBuilder, StreamBuilder, custom painting, animations, themes, responsive layout, GoRouter, platform detection, web-specific features, and testing
- **Advanced (Examples 56-80)**: Platform and scale covering BLoC/Cubit, custom RenderObject, dart:html / dart:js_interop, canvas rendering, web workers via Isolates, IndexedDB, WebSocket, PWA features, performance profiling, accessibility, internationalization, deep linking, deferred loading, Docker/nginx deployment, and production patterns

Together, these examples cover **95% of what you will use** in production Flutter Web applications.

## What Is Covered

### Core Widget System

- **Widget Tree**: StatelessWidget, StatefulWidget, BuildContext, widget composition
- **Material Widgets**: MaterialApp, Scaffold, AppBar, Drawer, BottomNavigationBar, FloatingActionButton
- **Layout Widgets**: Column, Row, Stack, Expanded, Flexible, Padding, SizedBox, Container, Center
- **Text and Input**: Text, TextField, TextFormField, Form, validation, controllers
- **Display**: Image, Icon, CircularProgressIndicator, LinearProgressIndicator
- **Lists and Grids**: ListView, ListView.builder, GridView, GridView.builder

### State Management

- **Local State**: setState, StatefulWidget lifecycle
- **Inherited State**: InheritedWidget, InheritedNotifier
- **Provider**: ChangeNotifier, Consumer, context.watch, context.read
- **Riverpod**: StateNotifierProvider, FutureProvider, StreamProvider, ref.watch
- **BLoC/Cubit**: Cubit, BlocBuilder, BlocListener, BlocProvider, event-driven state

### Networking and Data

- **HTTP**: http package, GET/POST/PUT/DELETE requests, headers, status codes
- **JSON**: json_decode, json_encode, fromJson/toJson factories, jsonSerializable
- **Async UI**: FutureBuilder, StreamBuilder, AsyncSnapshot states
- **WebSocket**: WebSocket connections, streams, real-time data

### Navigation and Routing

- **Navigator 1.0**: Navigator.push, Navigator.pop, named routes
- **GoRouter**: route configuration, path parameters, query parameters, deep linking
- **Web URL strategy**: PathUrlStrategy, hash vs path URLs

### Animations

- **Implicit Animations**: AnimatedContainer, AnimatedOpacity, AnimatedSwitcher
- **Explicit Animations**: AnimationController, Tween, CurvedAnimation, AnimatedBuilder
- **Hero Animations**: Hero widget for shared element transitions

### Web-Specific Features

- **Platform Detection**: kIsWeb, defaultTargetPlatform
- **URL Strategy**: setUrlStrategy, PathUrlStrategy for clean URLs
- **dart:html / dart:js_interop**: DOM access, JavaScript interop, web APIs
- **IndexedDB**: Browser storage beyond localStorage
- **PWA**: Manifest, service worker, offline support
- **SEO**: Meta tags, canonical URLs, OpenGraph

### Rendering and Custom Drawing

- **CustomPainter**: Canvas API, drawing primitives, paths
- **CustomRenderObject**: Low-level layout and painting protocol

### Testing

- **Widget Tests**: WidgetTester, pump, find, expect
- **Golden Tests**: matchesGoldenFile, visual regression testing

### Production and Deployment

- **Performance**: DevTools, timeline, frame budget
- **Accessibility**: Semantics widget, screen reader support
- **Internationalization**: flutter_localizations, AppLocalizations, ARB files
- **Deferred Loading**: deferred as keyword, lazy imports
- **Docker/nginx**: Multi-stage build, serving Flutter Web with nginx

## What Is NOT Covered

We exclude topics that belong in specialized tutorials:

- **Dart language fundamentals**: Master Dart first through language tutorials (null safety, async/await, generics, extensions)
- **Mobile-specific Flutter**: Platform channels to Android/iOS native code, mobile permissions, camera
- **Advanced DevOps**: Kubernetes, CDN configuration, complex CI/CD pipelines
- **Firebase integration**: Authentication, Firestore, Cloud Functions - these warrant dedicated tutorials
- **Advanced graphics**: Shader programs, 3D rendering, complex physics simulations
- **Flutter internals**: Engine architecture, widget binding, rendering pipeline internals

For these topics, see dedicated tutorials and the official Flutter documentation.

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to Flutter?** Start with Beginner (Example 1)
- **Framework experience** (React, Angular, Vue)? Start with Intermediate (Example 28)
- **Building specific feature?** Search for the relevant example topic

### 2. Read the Example

Each example has five parts:

- **Brief Explanation** (2-3 sentences): What Flutter concept, why it exists, when to use it
- **Mermaid Diagram** (when appropriate): Visual representation of widget relationships or data flow
- **Heavily Annotated Code** (with `// =>` comments): Working Dart code showing the pattern with inline annotations documenting values, states, and outputs
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production context and practical significance

### 3. Run the Code

Create a Flutter project and run each example:

```bash
flutter create my_flutter_web_app
cd my_flutter_web_app
flutter run -d chrome
# Replace lib/main.dart with example code
```

### 4. Modify and Experiment

Change widget properties, add features, break things on purpose. Experimenting builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Relationship to Other Tutorial Types

| Tutorial Type               | Approach                       | Coverage              | Best For                       |
| --------------------------- | ------------------------------ | --------------------- | ------------------------------ |
| **By Example** (this guide) | Code-first, 80 examples        | 95% breadth           | Learning framework idioms      |
| **Quick Start**             | Project-based, hands-on        | 5-30% touchpoints     | Getting something working fast |
| **Beginner Tutorial**       | Narrative, explanation-first   | 0-40% comprehensive   | Understanding concepts deeply  |
| **Intermediate Tutorial**   | Problem-solving, practical     | 40-75% patterns       | Building real features         |
| **Advanced Tutorial**       | Specialized topics, deep dives | 75-95% expert mastery | Optimizing, scaling, internals |
| **Cookbook**                | Recipe-based, problem-solution | Problem-specific      | Solving specific problems      |

## Prerequisites

### Required

- **Dart fundamentals**: Basic syntax, null safety, async/await, collections, classes
- **Web development**: HTML basics, CSS concepts, browser developer tools
- **Programming experience**: You have built applications before in another language

### Recommended

- **Object-oriented programming**: Classes, inheritance, interfaces, generics
- **State management concepts**: Familiarity with any state management pattern
- **HTTP and REST**: Understanding of request/response, JSON, status codes

### Not Required

- **Flutter experience**: This guide assumes you are new to the framework
- **Mobile development experience**: Not necessary, but helpful for understanding widget concepts
- **JavaScript framework experience**: Helpful but not required

## Structure of Each Example

All examples follow a consistent five-part format:

````
### Example N: Descriptive Title

2-3 sentence explanation of the concept.

```dart
// Heavily annotated code example
// showing the Flutter pattern in action
// => annotations document values, states, outputs
````

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words explaining production relevance.

```

**Code annotations**:

- `// =>` shows expected output, widget tree result, or variable value
- Inline comments explain what each line does and why
- Variable names are self-documenting

**Mermaid diagrams** appear when visualizing widget hierarchy, data flow, or state transitions improves understanding. All diagrams use a color-blind friendly palette:

- Blue `#0173B2` - Primary elements
- Orange `#DE8F05` - Decisions and secondary
- Teal `#029E73` - Success and accent
- Purple `#CC78BC` - Alternative states
- Brown `#CA9161` - Neutral elements

## Ready to Start?

Choose your learning path:

- **[Beginner](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner)** - Start here if new to Flutter. Build foundation understanding through 27 core examples covering the essential widget system and state patterns.
- **[Intermediate](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate)** - Jump here if you know Flutter basics. Master production patterns through 28 examples covering networking, state management libraries, animations, routing, and web-specific features.
- **[Advanced](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced)** - Expert mastery through 25 advanced examples covering platform interop, custom rendering, PWA features, performance, accessibility, and production deployment.

Or jump to specific topics by searching for relevant example keywords.
```

## Examples by Level

### Beginner (Examples 1–27)

- [Example 1: MaterialApp and runApp](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-1-materialapp-and-runapp)
- [Example 2: Scaffold and AppBar](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-2-scaffold-and-appbar)
- [Example 3: Text Widget and Typography](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-3-text-widget-and-typography)
- [Example 4: Container Widget](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-4-container-widget)
- [Example 5: Column and Row](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-5-column-and-row)
- [Example 6: Stack and Positioned](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-6-stack-and-positioned)
- [Example 7: Expanded and Flexible](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-7-expanded-and-flexible)
- [Example 8: Padding and SizedBox](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-8-padding-and-sizedbox)
- [Example 9: StatelessWidget Composition](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-9-statelesswidget-composition)
- [Example 10: StatefulWidget and setState](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-10-statefulwidget-and-setstate)
- [Example 11: Button Variants](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-11-button-variants)
- [Example 12: TextField and TextEditingController](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-12-textfield-and-texteditingcontroller)
- [Example 13: Form Validation](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-13-form-validation)
- [Example 14: Image Widget](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-14-image-widget)
- [Example 15: ListView and ListView.builder](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-15-listview-and-listviewbuilder)
- [Example 16: GridView](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-16-gridview)
- [Example 17: Navigator Push and Pop](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-17-navigator-push-and-pop)
- [Example 18: AppBar with Navigation](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-18-appbar-with-navigation)
- [Example 19: Drawer Navigation](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-19-drawer-navigation)
- [Example 20: BottomNavigationBar](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-20-bottomnavigationbar)
- [Example 21: Progress Indicators](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-21-progress-indicators)
- [Example 22: Icons](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-22-icons)
- [Example 23: Card Widget](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-23-card-widget)
- [Example 24: AlertDialog and showDialog](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-24-alertdialog-and-showdialog)
- [Example 25: SnackBar and ScaffoldMessenger](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-25-snackbar-and-scaffoldmessenger)
- [Example 26: Chip Variants](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-26-chip-variants)
- [Example 27: Switch, Checkbox, and Radio](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/beginner#example-27-switch-checkbox-and-radio)

### Intermediate (Examples 28–55)

- [Example 28: InheritedWidget](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-28-inheritedwidget)
- [Example 29: Provider Package](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-29-provider-package)
- [Example 30: Riverpod](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-30-riverpod)
- [Example 31: HTTP GET Request](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-31-http-get-request)
- [Example 32: HTTP POST with JSON Body](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-32-http-post-with-json-body)
- [Example 33: FutureBuilder](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-33-futurebuilder)
- [Example 34: StreamBuilder](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-34-streambuilder)
- [Example 35: Implicit Animations](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-35-implicit-animations)
- [Example 36: Explicit Animations](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-36-explicit-animations)
- [Example 37: ThemeData and Custom Themes](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-37-themedata-and-custom-themes)
- [Example 38: Responsive Layout with LayoutBuilder and MediaQuery](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-38-responsive-layout-with-layoutbuilder-and-mediaquery)
- [Example 39: GoRouter Configuration](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-39-gorouter-configuration)
- [Example 40: GoRouter with Shell Routes and Navigation Rail](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-40-gorouter-with-shell-routes-and-navigation-rail)
- [Example 41: Platform Detection](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-41-platform-detection)
- [Example 42: URL Strategy for Clean URLs](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-42-url-strategy-for-clean-urls)
- [Example 43: Widget Tests](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-43-widget-tests)
- [Example 44: CustomPainter](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-44-custompainter)
- [Example 45: Hero Animations](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-45-hero-animations)
- [Example 46: ValueNotifier and ValueListenableBuilder](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-46-valuenotifier-and-valuelistenablebuilder)
- [Example 47: PageView and TabBar](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-47-pageview-and-tabbar)
- [Example 48: InkWell, GestureDetector, and MouseRegion](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-48-inkwell-gesturedetector-and-mouseregion)
- [Example 49: Dismissible and Reorderable Lists](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-49-dismissible-and-reorderable-lists)
- [Example 50: FocusNode and Keyboard Handling](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-50-focusnode-and-keyboard-handling)
- [Example 51: Sliver Widgets and CustomScrollView](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-51-sliver-widgets-and-customscrollview)
- [Example 52: Overlay and OverlayEntry](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-52-overlay-and-overlayentry)
- [Example 53: Async Initialization with FutureBuilder in initState](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-53-async-initialization-with-futurebuilder-in-initstate)
- [Example 54: Scrolling Controllers and Scroll Physics](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-54-scrolling-controllers-and-scroll-physics)
- [Example 55: Cached Network Images and Performance](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/intermediate#example-55-cached-network-images-and-performance)

### Advanced (Examples 56–80)

- [Example 56: Cubit](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-56-cubit)
- [Example 57: BLoC with Events](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-57-bloc-with-events)
- [Example 58: dart:js_interop](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-58-dartjs_interop)
- [Example 59: IndexedDB via dart:js_interop](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-59-indexeddb-via-dartjs_interop)
- [Example 60: WebSocket Real-time Communication](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-60-websocket-real-time-communication)
- [Example 61: PWA Configuration](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-61-pwa-configuration)
- [Example 62: const Constructors and Widget Caching](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-62-const-constructors-and-widget-caching)
- [Example 63: RepaintBoundary and Performance Profiling](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-63-repaintboundary-and-performance-profiling)
- [Example 64: Semantics Widget](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-64-semantics-widget)
- [Example 65: Internationalization with flutter_localizations](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-65-internationalization-with-flutter_localizations)
- [Example 66: Deferred Loading (Code Splitting)](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-66-deferred-loading-code-splitting)
- [Example 67: Docker and nginx Deployment](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-67-docker-and-nginx-deployment)
- [Example 68: Environment Configuration](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-68-environment-configuration)
- [Example 69: Custom RenderObject](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-69-custom-renderobject)
- [Example 70: BlocListener and Side Effects](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-70-bloclistener-and-side-effects)
- [Example 71: Testing with BlocTest](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-71-testing-with-bloctest)
- [Example 72: Isolates for CPU-Intensive Work](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-72-isolates-for-cpu-intensive-work)
- [Example 73: Custom Scroll Physics](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-73-custom-scroll-physics)
- [Example 74: Accessibility Testing](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-74-accessibility-testing)
- [Example 75: Golden Tests](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-75-golden-tests)
- [Example 76: Custom Clipper](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-76-custom-clipper)
- [Example 77: SelectionArea and Text Copying](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-77-selectionarea-and-text-copying)
- [Example 78: Image Optimization and WebP](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-78-image-optimization-and-webp)
- [Example 79: SliverPersistentHeader and Pinned Headers](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-79-sliverpersistentheader-and-pinned-headers)
- [Example 80: Production Checklist and Performance Audit](/en/learn/software-engineering/platforms/web/tools/dart-flutter-web/by-example/advanced#example-80-production-checklist-and-performance-audit)
