---
title: "Intermediate"
weight: 10000002
date: 2026-04-29T00:00:00+07:00
draft: false
description: "Master production React Native patterns through 28 annotated examples covering animations, gestures, state management, camera, sensors, forms, and advanced navigation"
tags:
  [
    "react-native",
    "expo",
    "mobile",
    "typescript",
    "by-example",
    "intermediate",
    "animations",
    "reanimated",
    "zustand",
    "tanstack-query",
  ]
---

This intermediate tutorial covers production React Native patterns through 28 heavily annotated examples. Each example maintains 1-2.25 comment lines per code line.

## Prerequisites

Before starting, complete the Beginner examples or ensure you understand:

- React Native core components (View, Text, FlatList, Modal)
- Expo Router navigation (Stack, Tabs, dynamic routes)
- React hooks (useState, useEffect, useCallback)
- TypeScript generics and discriminated unions

## Group 9: Animations

### Example 29: useAnimatedValue — The New RN 0.85 Hook

React Native 0.85 introduces `useAnimatedValue` as a hook replacement for `new Animated.Value()`. The hook integrates cleanly with React's rendering lifecycle.

**Before RN 0.85 (legacy, do NOT use)**:

```typescript
// OLD pattern — deprecated in RN 0.85
const opacity = useRef(new Animated.Value(0)).current;
// => new Animated.Value() required wrapping in useRef to avoid recreation on re-render
// => verbose, error-prone, not idiomatic hook usage
```

**New in RN 0.85 — useAnimatedValue hook**:

```typescript
import { useAnimatedValue, Animated, Easing, View, Text, Pressable, StyleSheet } from 'react-native';
// => useAnimatedValue: new hook in RN 0.85 (replaces new Animated.Value() pattern)

export default function AnimatedValueDemo() {
  const opacity = useAnimatedValue(0);
  // => opacity: Animated.Value starting at 0
  // => hook: automatically stable across re-renders (no useRef wrapper needed)

  const scale = useAnimatedValue(1);
  // => scale: Animated.Value starting at 1 (100%)

  const fadeIn = () => {
    Animated.timing(opacity, {
      toValue: 1,               // => animate from current value to 1
      duration: 500,            // => 500ms
      easing: Easing.ease,      // => ease-in-out timing curve
      useNativeDriver: true,    // => CRITICAL: run animation on native thread (60fps)
      // => useNativeDriver: true REQUIRED for opacity, transform animations
      // => useNativeDriver: false needed for layout props (width, height) — see Example 30
    }).start();
  };

  const pulse = () => {
    Animated.sequence([
      // => sequence: run animations one after another
      Animated.timing(scale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const springBounce = () => {
    Animated.spring(scale, {
      toValue: 1.3,
      friction: 3,              // => lower = more bouncy (default 7)
      tension: 100,             // => higher = faster spring (default 40)
      useNativeDriver: true,
    }).start(() => {
      // => start() callback: fires when animation completes
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.box, { opacity, transform: [{ scale }] }]}>
        {/* => Animated.View: wrapper that applies animated styles */}
        {/* => opacity and scale are Animated.Value, not plain numbers */}
        <Text style={styles.boxText}>Animated Box</Text>
      </Animated.View>

      <Pressable style={styles.button} onPress={fadeIn}>
        <Text style={styles.buttonText}>Fade In</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={pulse}>
        <Text style={styles.buttonText}>Pulse</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={springBounce}>
        <Text style={styles.buttonText}>Spring Bounce</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  box: {
    width: 120,
    height: 120,
    backgroundColor: '#0173B2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  boxText: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#DE8F05',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**Key Takeaway**: Use `useAnimatedValue(initialValue)` in RN 0.85+ instead of `useRef(new Animated.Value()).current`. Always set `useNativeDriver: true` for `opacity` and `transform` animations to run on the native thread.

**Why It Matters**: `useAnimatedValue` integrates animation state with React's hook model — no more `useRef` boilerplate. `useNativeDriver: true` is the single biggest animation performance lever: it moves interpolation computation from the JS thread to the native thread, maintaining 60fps even when JS is busy processing data. Without native driver, animation frames are tied to JS execution time, causing dropped frames during heavy computation. The hook form makes animated values behave consistently with other React state during StrictMode double-rendering.

### Example 30: Animating Layout Props Natively — RN 0.85 Shared Animation Backend

React Native 0.85 adds the Shared Animation Backend, enabling native-thread animation of layout props (width, height, padding, margin) that previously required `useNativeDriver: false`.

```typescript
import { useAnimatedValue, Animated, Pressable, View, Text, StyleSheet } from 'react-native';

export default function LayoutAnimationDemo() {
  const width = useAnimatedValue(100);
  // => width: Animated.Value for layout width (previously required useNativeDriver: false)
  const height = useAnimatedValue(60);

  const expand = () => {
    Animated.parallel([
      // => parallel: run multiple animations simultaneously
      Animated.spring(width, {
        toValue: 280,
        friction: 6,
        useNativeDriver: false,
        // => RN 0.85 Shared Animation Backend: layout props CAN now run natively
        // => Still use useNativeDriver: false API but runs on native Shared Backend
        // => Benefit: JS thread free during layout animation
      }),
      Animated.spring(height, {
        toValue: 160,
        friction: 6,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const collapse = () => {
    Animated.parallel([
      Animated.spring(width, { toValue: 100, friction: 6, useNativeDriver: false }),
      Animated.spring(height, { toValue: 60, friction: 6, useNativeDriver: false }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.box, { width, height }]}>
        {/* => width and height are Animated.Values driving layout */}
        {/* => box changes size smoothly via Shared Animation Backend */}
        <Text style={styles.boxText}>Expand Me</Text>
      </Animated.View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={expand}>
          <Text style={styles.buttonText}>Expand</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={collapse}>
          <Text style={styles.buttonText}>Collapse</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    padding: 24,
  },
  box: {
    backgroundColor: '#029E73',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  boxText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    backgroundColor: '#0173B2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**Key Takeaway**: RN 0.85's Shared Animation Backend animates layout props (width, height, margin, padding) natively, freeing the JS thread. Use `useNativeDriver: false` in the API — the backend automatically routes to native execution.

**Why It Matters**: Before RN 0.85, animating layout props ran on the JS thread, causing jank when JS was busy. The Shared Animation Backend computes layout changes in C++ on the native thread via Fabric's synchronous layout engine, resulting in smooth animations even during data fetching or list processing. This enables card expand/collapse, accordion, sidebar slide animations that were previously only achievable with Reanimated's more complex API.

### Example 31: Reanimated 4 — useSharedValue, useAnimatedStyle, withTiming, withSpring

`react-native-reanimated` 4.x provides the most powerful animation API in React Native. Requires the New Architecture (mandatory since RN 0.82).

```typescript
import Animated, {
  useSharedValue,           // => state that lives on the UI thread
  useAnimatedStyle,         // => derives animated style from shared values
  withTiming,               // => duration-based animation
  withSpring,               // => physics-based spring animation
  Easing,
} from 'react-native-reanimated';
// => react-native-reanimated 4.x — New Architecture ONLY
// => requires: react-native-worklets (separate package for worklet runtime)
import { Pressable, View, Text, StyleSheet } from 'react-native';

export default function ReanimatedBasicDemo() {
  const translateX = useSharedValue(0);
  // => useSharedValue: value lives on UI thread (NOT React state)
  // => zero serialization between JS and native — direct C++ memory access

  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(0);
  // => shared values can hold any numeric data

  const animatedStyle = useAnimatedStyle(() => ({
    // => useAnimatedStyle: worklet that runs on UI thread (not JS thread)
    // => 'use worklet' is implicit inside useAnimatedStyle callback
    transform: [
      { translateX: translateX.value },   // => reads from UI thread — no async
      { scale: scale.value },
    ],
    backgroundColor: backgroundColor.value === 0 ? '#0173B2' : '#029E73',
    // => conditional expressions run on UI thread
  }));
  // => animatedStyle: derived style that updates without touching React state

  const moveRight = () => {
    translateX.value = withTiming(200, {
      duration: 400,                      // => 400ms linear-by-default
      easing: Easing.out(Easing.quad),    // => decelerate curve
    });
    // => withTiming: wraps value in a timed animation descriptor
    // => assigning to .value on UI thread schedules animation
    backgroundColor.value = withTiming(1, { duration: 400 });
  };

  const moveBack = () => {
    translateX.value = withSpring(0, {
      damping: 10,          // => damping: oscillation control (higher = less oscillation)
      stiffness: 100,       // => stiffness: spring force (higher = faster)
    });
    // => withSpring: physics-based, no explicit duration
    scale.value = withSpring(1);
    backgroundColor.value = withTiming(0, { duration: 300 });
  };

  const squish = () => {
    scale.value = withSpring(0.8, { damping: 3, stiffness: 300 });
    // => low damping: bouncy squish effect
  };

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.ball, animatedStyle]}>
          {/* => Animated.View from reanimated (NOT from react-native) */}
        </Animated.View>
      </View>
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={moveRight}><Text style={styles.buttonText}>Right</Text></Pressable>
        <Pressable style={styles.button} onPress={moveBack}><Text style={styles.buttonText}>Back</Text></Pressable>
        <Pressable style={styles.button} onPress={squish}><Text style={styles.buttonText}>Squish</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24, padding: 24 },
  track: { width: '100%', height: 80, justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: 8 },
  ball: { width: 60, height: 60, borderRadius: 30, marginLeft: 10 },
  buttons: { flexDirection: 'row', gap: 12 },
  button: { backgroundColor: '#0173B2', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
```

**Key Takeaway**: `useSharedValue` stores animation state on the UI thread. `useAnimatedStyle` derives styles in a worklet (UI thread function). Assign `withTiming()` or `withSpring()` to `.value` to trigger animations — no JS-to-native bridge crossing.

**Why It Matters**: Reanimated 4 is the gold standard for React Native animations. The worklet architecture runs animation math in C++ on the UI thread — completely isolated from the JS thread. This means complex gesture-driven animations maintain 60fps even when JS is parsing large JSON responses or running expensive computations. The direct C++ memory access via JSI eliminates the ~1ms serialization overhead of the legacy bridge per animation frame, enabling data-intensive animations like VisionCamera frame analysis overlays.

### Example 32: Reanimated 4 Worklets — UI Thread Logic

Worklets are JavaScript functions marked to run on the UI thread. They access shared values without crossing the JS-native boundary.

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
} from 'react-native-reanimated';
// => requires react-native-worklets separately in Reanimated 4
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';

export default function WorkletDemo() {
  const progress = useSharedValue(0);
  // => progress: 0-1, lives on UI thread

  const [jsLabel, setJsLabel] = useState('0%');
  // => React state: JS thread only, updated via runOnJS bridge

  const animatedBarStyle = useAnimatedStyle(() => ({
    // => THIS FUNCTION IS A WORKLET — runs on UI thread
    // => 'use worklet' directive is implicitly added by Reanimated babel plugin
    width: `${progress.value * 100}%`,
    // => all expressions run on UI thread: no JS involvement per frame
    backgroundColor: progress.value < 0.5 ? '#DE8F05' : '#029E73',
    // => conditional logic also runs on UI thread
  }));

  useAnimatedReaction(
    () => progress.value,
    // => first arg: worklet selector (runs on UI thread)
    (currentValue) => {
      // => second arg: reaction worklet (runs on UI thread)
      runOnJS(setJsLabel)(`${Math.round(currentValue * 100)}%`);
      // => runOnJS: schedules a call to a JS function from the UI thread
      // => ONLY use for rare updates (not every frame) — has bridge overhead
    }
  );
  // => useAnimatedReaction: run worklet whenever shared value changes

  const loadData = () => {
    // => This function runs on the JS thread
    runOnUI(() => {
      // => runOnUI: schedule a worklet to run on UI thread from JS
      'worklet';                        // => explicit worklet directive
      progress.value = 0;              // => reset on UI thread
      // => withTiming import needed here for full example
    })();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Progress: {jsLabel}</Text>
      <View style={styles.trackOuter}>
        <Animated.View style={[styles.trackInner, animatedBarStyle]} />
        {/* => width animates smoothly on UI thread */}
      </View>
      <Pressable style={styles.button} onPress={loadData}>
        <Text style={styles.buttonText}>Reset</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 20 },
  label: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  trackOuter: { height: 20, backgroundColor: '#eee', borderRadius: 10, overflow: 'hidden' },
  trackInner: { height: '100%', borderRadius: 10 },
  button: { backgroundColor: '#0173B2', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
```

**Key Takeaway**: Worklets run on the UI thread with no JS involvement. Use `runOnJS()` sparingly to bridge back to React state. Use `runOnUI()` to schedule UI thread work from JS event handlers.

**Why It Matters**: The worklet model enables sub-millisecond response to gestures — a `PanGestureHandler` can update 60 animated positions per second on the UI thread without ever waiting for JS. `runOnJS` is the bridge back to React state (for things like updating a visible label), but should only be called for meaningful state changes (not every animation frame). Understanding the JS-UI thread boundary and how worklets cross it is essential for building gesture-driven interfaces that feel native.

### Example 33: Gesture Handling — Pan, Tap, GestureDetector

`react-native-gesture-handler` 2.31.1 provides composable gesture recognizers that run on the UI thread via Reanimated worklets.

```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { View, Text, StyleSheet } from 'react-native';

export default function GestureDemo() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  // => shared values track current drag position

  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  // => saved values: persist position between drag sessions

  const isActive = useSharedValue(false);
  // => tracks whether gesture is currently active

  const panGesture = Gesture.Pan()
    // => Gesture.Pan(): recognizes drag/swipe gestures
    .onStart(() => {
      'worklet';                        // => runs on UI thread
      isActive.value = true;
      savedX.value = translateX.value;  // => save current position at gesture start
      savedY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = savedX.value + event.translationX;
      // => event.translationX: total movement since gesture started
      translateY.value = savedY.value + event.translationY;
    })
    .onEnd(() => {
      'worklet';
      isActive.value = false;
    });

  const tapGesture = Gesture.Tap()
    // => Gesture.Tap(): single tap recognizer
    .onStart(() => {
      'worklet';
      translateX.value = withSpring(0);    // => spring back to center on tap
      translateY.value = withSpring(0);
    });

  const composed = Gesture.Simultaneous(panGesture, tapGesture);
  // => Simultaneous: both gestures activate at the same time

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: isActive.value ? 1.1 : 1 },   // => scale up while dragging
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      {/* => GestureDetector: wraps the view that receives gestures */}
      <View style={styles.container}>
        <Animated.View style={[styles.draggable, animatedStyle]}>
          <Text style={styles.hint}>Drag Me</Text>
          <Text style={styles.hint2}>Tap to Center</Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  draggable: {
    width: 120,
    height: 120,
    backgroundColor: '#CC78BC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hint: { color: '#fff', fontWeight: '700', fontSize: 14 },
  hint2: { color: '#fff', fontSize: 11, opacity: 0.8 },
});
```

**Key Takeaway**: Wrap with `GestureDetector` and pass a `Gesture.Pan()` / `Gesture.Tap()` instance. Gesture callbacks are worklets — run on UI thread. Use `Gesture.Simultaneous()` to recognize multiple gestures at once.

**Why It Matters**: react-native-gesture-handler's worklet-based gesture recognizers are the gold standard for React Native interactions. They run on the native gesture thread, receiving touch events before the JS thread is even aware — enabling zero-latency gesture response. The composable Gesture API (`Simultaneous`, `Exclusive`, `Race`) solves the classic gesture conflict problem (horizontal list swipe conflicting with screen-level swipe-to-go-back) declaratively rather than through manual event propagation hacks.

### Example 34: Combined Gestures — Simultaneous, Exclusive, Race

Compose multiple gesture recognizers to handle complex multi-touch and sequential interactions.

```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { View, Text, StyleSheet } from 'react-native';

export default function CombinedGesturesDemo() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedScale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    // => Gesture.Pinch(): two-finger spread/squeeze to scale
    .onStart(() => { 'worklet'; savedScale.value = scale.value; })
    .onUpdate((event) => {
      'worklet';
      scale.value = savedScale.value * event.scale;
      // => event.scale: ratio relative to start (1.0 = same, 2.0 = double)
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(1);   // => spring back to original size
    });

  const rotationGesture = Gesture.Rotation()
    // => Gesture.Rotation(): two-finger twist to rotate
    .onUpdate((event) => {
      'worklet';
      rotation.value = event.rotation;   // => radians rotated since start
    })
    .onEnd(() => {
      'worklet';
      rotation.value = withSpring(0);    // => spring back
    });

  const pinchAndRotate = Gesture.Simultaneous(pinchGesture, rotationGesture);
  // => Simultaneous: both gestures activate at same time on same view
  // => Essential for transform controls that combine scale + rotation

  // => Exclusive: only the first recognized gesture activates
  const swipeLeft = Gesture.Pan().onUpdate((e) => { 'worklet'; /* handle */ });
  const swipeRight = Gesture.Pan().onUpdate((e) => { 'worklet'; /* handle */ });
  const exclusiveSwipe = Gesture.Exclusive(swipeLeft, swipeRight);
  // => Exclusive: first gesture to activate cancels others
  // => Useful when gestures have directional priorities

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },  // => CSS-like rotate with unit
    ],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Pinch to scale, twist to rotate</Text>
      <GestureDetector gesture={pinchAndRotate}>
        <Animated.View style={[styles.target, animatedStyle]}>
          <Text style={styles.targetText}>Two Fingers</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, padding: 24 },
  instruction: { fontSize: 14, color: '#666', textAlign: 'center' },
  target: {
    width: 160,
    height: 160,
    backgroundColor: '#0173B2',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
```

**Key Takeaway**: Compose gestures with `Gesture.Simultaneous()` (both activate), `Gesture.Exclusive()` (first wins), or `Gesture.Race()` (first recognized wins, others cancelled). All gesture callbacks are worklets running on the UI thread.

**Why It Matters**: Photo viewer apps require pinch + rotation + pan simultaneously on the same image — impossible without `Gesture.Simultaneous`. Social feeds require swipe gestures to not conflict with list scrolling — solved with `Gesture.Exclusive` priorities. The declarative composition model eliminates the manual gesture recognizer delegation code required in native Swift/Kotlin development. Production-quality gesture handling (like the iOS Photos app) is achievable in React Native through this API.

## Group 10: High-Performance Lists

### Example 35: FlashList — Drop-in FlatList Replacement

`@shopify/flash-list` 2.3.1 is 5-10x faster than FlatList for large lists through a native recycler pool that reuses cell components instead of unmounting/remounting them.

```typescript
import { FlashList } from '@shopify/flash-list';
// => @shopify/flash-list 2.3.1: requires New Architecture (enabled by default in Expo SDK 55)
import { View, Text, StyleSheet } from 'react-native';

type Item = {
  id: string;
  title: string;
  subtitle: string;
  value: number;
};

const DATA: Item[] = Array.from({ length: 500 }, (_, i) => ({
  id: `item-${i}`,
  title: `Item ${i + 1}`,
  subtitle: `Subtitle for item ${i + 1}`,
  value: Math.random() * 1000,
}));

function ItemRow({ item }: { item: Item }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.rowValue}>{item.value.toFixed(2)}</Text>
    </View>
  );
}

export default function FlashListDemo() {
  return (
    <FlashList
      data={DATA}
      renderItem={({ item }) => <ItemRow item={item} />}
      // => same renderItem signature as FlatList — drop-in replacement
      keyExtractor={(item) => item.id}
      estimatedItemSize={72}
      // => estimatedItemSize: REQUIRED by FlashList — average item height in pts
      // => Incorrect value causes layout jumps — measure your item height
      // => FlashList uses this for initial scroll position calculation
      overrideItemLayout={(layout, item) => {
        layout.size = 72;              // => exact item size if uniform (optional)
        // => Overriding with exact size eliminates all layout recalculation
      }}
      drawDistance={250}
      // => drawDistance: pts beyond viewport to render (default 250)
      // => higher = smoother fast scroll, higher memory usage
      ListHeaderComponent={<Text style={styles.header}>500 Items (FlashList)</Text>}
      contentContainerStyle={styles.content}
    />
    // => FlashList performance vs FlatList:
    // => FlatList: creates/destroys JSX components on scroll
    // => FlashList: recycles native cell pool (like iOS UICollectionView)
    // => Result: 5-10x fewer JS renders on fast scroll
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  header: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  rowValue: { fontSize: 14, color: '#029E73', fontWeight: '600' },
});
```

**Key Takeaway**: Replace `FlatList` with `FlashList` and provide `estimatedItemSize`. The recycler pool avoids component mount/unmount on scroll, delivering 5-10x performance improvement for lists with 100+ items.

**Why It Matters**: FlatList's JS-driven virtualization unmounts and remounts React components as items scroll off-screen, generating React reconciliation work proportional to scroll speed. FlashList's recycler pool (mirroring iOS UICollectionView and Android RecyclerView) reuses the same rendered cell views — only prop updates occur, not full mounts. This eliminates the major source of scroll jank in data-heavy screens like transaction history, activity feeds, and product catalogs with hundreds of items.

### Example 36: Infinite Scroll — FlashList + TanStack Query

Combining FlashList's performance with TanStack Query's `useInfiniteQuery` creates production-ready infinite scroll.

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

type Post = { id: number; title: string; body: string };
type Page = { posts: Post[]; nextCursor: number | null };

async function fetchPosts({ pageParam = 0 }: { pageParam: number }): Promise<Page> {
  // => pageParam: cursor from previous page's getNextPageParam result
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_start=${pageParam}&_limit=10`
  );
  const posts: Post[] = await response.json();
  return {
    posts,
    nextCursor: posts.length === 10 ? pageParam + 10 : null,
    // => null nextCursor signals no more pages
  };
}

export default function InfiniteScrollDemo() {
  const {
    data,                    // => { pages: Page[], pageParams: number[] }
    fetchNextPage,           // => function: load next page
    hasNextPage,             // => boolean: more pages available
    isFetchingNextPage,      // => boolean: currently loading next page
    isLoading,               // => boolean: initial load in progress
    isError,
  } = useInfiniteQuery({
    queryKey: ['posts'],     // => cache key (array for namespacing)
    queryFn: fetchPosts,
    initialPageParam: 0,     // => TanStack Query v5: explicit initial cursor
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // => returns cursor for next page (undefined = no more pages)
  });

  const allPosts = data?.pages.flatMap(page => page.posts) ?? [];
  // => flatten pages array into single list for FlashList

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0173B2" />
      </View>
    );
  }

  return (
    <FlashList
      data={allPosts}
      keyExtractor={(item) => String(item.id)}
      estimatedItemSize={100}
      renderItem={({ item }) => (
        <View style={styles.post}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postBody} numberOfLines={3}>{item.body}</Text>
        </View>
      )}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
          // => triggers queryFn with next pageParam from getNextPageParam
        }
      }}
      onEndReachedThreshold={0.5}
      // => 0.5 = trigger when 50% from end (start fetching early)
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator color="#0173B2" />
            <Text style={styles.footerText}>Loading more...</Text>
          </View>
        ) : hasNextPage ? null : (
          <Text style={styles.endText}>All posts loaded</Text>
        )
      }
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  post: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  postTitle: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize', marginBottom: 6 },
  postBody: { fontSize: 13, color: '#666', lineHeight: 19 },
  footer: { padding: 20, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#666', fontSize: 14 },
  endText: { textAlign: 'center', color: '#999', padding: 20, fontSize: 13 },
});
```

**Key Takeaway**: `useInfiniteQuery` manages paginated data fetching with cursor-based pagination. Flatten `data.pages` for FlashList. Trigger `fetchNextPage()` in `onEndReached`. TanStack Query handles caching, deduplication, and background refresh.

**Why It Matters**: Infinite scroll is the standard pattern for social feeds, product catalogs, and activity histories. `useInfiniteQuery` encapsulates the complex state management (current cursor, loading states, error states, cache invalidation) that manual pagination requires. TanStack Query's cache means returning to the screen shows cached data instantly while refreshing in the background — the "stale-while-revalidate" pattern users expect from native apps. The combination of FlashList + TanStack Query is the production standard for high-performance paginated lists.

## Group 11: State Management

### Example 37: TanStack Query — useQuery, useMutation

TanStack Query 5.100.5 manages server state (fetching, caching, synchronizing) so React state manages only UI state.

```typescript
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
// => @tanstack/react-query 5.100.5
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';

type User = { id: number; name: string; email: string };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // => 5 minutes: data considered fresh
      gcTime: 1000 * 60 * 10,       // => 10 minutes: garbage collect after (v5: was cacheTime)
      retry: 2,                      // => retry failed requests 2 times
    },
  },
});

function UserProfile({ userId }: { userId: number }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user', userId],       // => cache key: array with ID for per-user caching
    queryFn: async () => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json() as Promise<User>;
      // => throw on error: TanStack Query catches and sets isError + error
    },
    enabled: userId > 0,             // => only fetch when userId is valid
  });

  const qc = useQueryClient();
  const updateUser = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      });
      return res.json() as Promise<User>;
    },
    onSuccess: (updatedUser) => {
      // => onSuccess: runs after mutation resolves
      qc.setQueryData(['user', userId], updatedUser);
      // => setQueryData: update cache directly (no refetch needed)
    },
    onError: (error) => {
      console.error('Update failed:', error);
    },
  });

  if (isLoading) return <ActivityIndicator color="#0173B2" style={{ flex: 1 }} />;
  if (isError) return <Text style={styles.errorText}>Error: {(error as Error).message}</Text>;

  return (
    <View style={styles.profile}>
      <Text style={styles.name}>{data?.name}</Text>
      <Text style={styles.email}>{data?.email}</Text>
      <Pressable
        style={styles.button}
        onPress={() => updateUser.mutate({ name: 'Updated Name' })}
        disabled={updateUser.isPending}
        // => isPending: mutation in flight (v5: was isLoading)
      >
        <Text style={styles.buttonText}>
          {updateUser.isPending ? 'Updating...' : 'Update Name'}
        </Text>
      </Pressable>
      <Pressable style={[styles.button, styles.secondary]} onPress={() => refetch()}>
        <Text style={styles.buttonText}>Refetch</Text>
      </Pressable>
    </View>
  );
}

export default function TanStackQueryDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* => QueryClientProvider: required at app root (usually in app/_layout.tsx) */}
      <UserProfile userId={1} />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  profile: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  name: { fontSize: 24, fontWeight: '700' },
  email: { fontSize: 16, color: '#666' },
  errorText: { color: '#c0392b', padding: 24 },
  button: { backgroundColor: '#0173B2', padding: 14, borderRadius: 8, alignItems: 'center' },
  secondary: { backgroundColor: '#DE8F05' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
```

**Key Takeaway**: `useQuery` fetches and caches server data with automatic stale-while-revalidate. `useMutation` handles write operations with optimistic updates via `setQueryData`. Wrap the app in `QueryClientProvider`.

**Why It Matters**: Before TanStack Query, developers maintained loading/error/data state for every API call manually — a pattern that scales poorly and introduces race conditions. TanStack Query treats server state as a separate concern from UI state, handling caching, background refresh, request deduplication, and retry logic automatically. The `staleTime` / `gcTime` configuration controls the caching tradeoff between data freshness and network usage — critical for mobile apps where users pay per megabyte of data.

### Example 38: TanStack Query — Focus and Window Management

TanStack Query automatically refetches data when the app returns from background — a critical mobile pattern.

```typescript
import { useQuery, focusManager, onlineManager } from "@tanstack/react-query";
import { AppState, AppStateStatus, Platform, NetInfo } from "react-native";
import { useEffect } from "react";
// => Integration: TanStack Query + React Native app state + network status

// => Call this ONCE in your app root (_layout.tsx)
function setupReactQueryMobileAdapters() {
  // => 1. AppState focus manager: refetch when app foregrounds
  AppState.addEventListener("change", (status: AppStateStatus) => {
    if (Platform.OS !== "web") {
      focusManager.setFocused(status === "active");
      // => focusManager: tells TanStack Query whether the app is "focused"
      // => When focused = true → triggers refetchOnWindowFocus behavior
    }
  });

  // => 2. Network manager: pause/resume queries based on connectivity
  // => Requires @react-native-community/netinfo
  // NetInfo.addEventListener(state => {
  //   onlineManager.setOnline(
  //     state.isConnected != null && state.isConnected &&
  //     Boolean(state.isInternetReachable)
  //   );
  // => onlineManager: when offline → queries pause and queue for when online
  // });
}

function useUserData(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await fetch(`https://api.example.com/users/${userId}`);
      return res.json();
    },
    staleTime: 30 * 1000, // => data fresh for 30 seconds
    refetchOnWindowFocus: true, // => refetch when app returns from background
    // => combined with AppState adapter: auto-refreshes on foreground
    refetchOnMount: true, // => refetch when component mounts (if stale)
    refetchOnReconnect: true, // => refetch when network comes back online
    // => combined with NetInfo adapter: auto-refetches after reconnect
  });
}
```

**Key Takeaway**: Integrate `focusManager` with `AppState` to trigger TanStack Query's `refetchOnWindowFocus` when the mobile app foregrounds. Integrate `onlineManager` with NetInfo for automatic retry after network reconnection.

**Why It Matters**: Mobile users background apps for hours and return expecting fresh data. Without the AppState adapter, TanStack Query's `refetchOnWindowFocus` does nothing on mobile (it's designed for browser tab focus events). The two-line integration transforms an entire app from showing stale data after backgrounding to automatically showing fresh data on every foreground — matching the behavior users expect from native apps like iOS Mail or Twitter. The NetInfo adapter handles spotty mobile connectivity gracefully.

### Example 39: Zustand — Global Store with TypeScript

Zustand provides minimal global state management without boilerplate. Perfect for app-wide UI state, user preferences, and cross-screen data.

```typescript
import { create } from 'zustand';
// => zustand ~5.x
import { View, Text, Pressable, StyleSheet } from 'react-native';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];                          // => state: cart items array
  total: number;                              // => derived state: computed total
  addItem: (item: Omit<CartItem, 'quantity'>) => void;    // => action
  removeItem: (id: string) => void;           // => action
  updateQuantity: (id: string, qty: number) => void;      // => action
  clearCart: () => void;                      // => action
};

const useCartStore = create<CartStore>((set, get) => ({
  // => create<Type>: define state + actions in one object
  // => set: function to update state (like React's setState)
  // => get: function to read current state inside actions
  items: [],
  total: 0,

  addItem: (item) => set((state) => {
    // => set receives current state, returns partial new state
    const existing = state.items.find(i => i.id === item.id);
    const newItems = existing
      ? state.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...state.items, { ...item, quantity: 1 }];
    const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { items: newItems, total };
  }),

  removeItem: (id) => set((state) => {
    const newItems = state.items.filter(i => i.id !== id);
    return { items: newItems, total: newItems.reduce((s, i) => s + i.price * i.quantity, 0) };
  }),

  updateQuantity: (id, qty) => set((state) => {
    const newItems = qty <= 0
      ? state.items.filter(i => i.id !== id)
      : state.items.map(i => i.id === id ? { ...i, quantity: qty } : i);
    return { items: newItems, total: newItems.reduce((s, i) => s + i.price * i.quantity, 0) };
  }),

  clearCart: () => set({ items: [], total: 0 }),
  // => set with plain object: replaces just those keys
}));

export default function ZustandDemo() {
  const { items, total, addItem, removeItem, clearCart } = useCartStore();
  // => useCartStore(): subscribes component to store changes
  // => re-renders ONLY when accessed slice changes (not entire store)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cart ({items.length} items)</Text>
      <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>

      {items.map(item => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.itemName}>{item.name} x{item.quantity}</Text>
          <Pressable onPress={() => removeItem(item.id)}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.button}
        onPress={() => addItem({ id: 'laptop', name: 'Laptop', price: 999.99 })}>
        <Text style={styles.buttonText}>Add Laptop</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.danger]} onPress={clearCart}>
        <Text style={styles.buttonText}>Clear Cart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  total: { fontSize: 18, color: '#029E73', fontWeight: '600' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 },
  itemName: { fontSize: 14 },
  remove: { color: '#c0392b', fontWeight: '600' },
  button: { backgroundColor: '#0173B2', padding: 14, borderRadius: 8, alignItems: 'center' },
  danger: { backgroundColor: '#CA9161' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
```

**Key Takeaway**: `create<Type>()` defines the entire store (state + actions). `useCartStore()` in components automatically re-renders only when accessed slices change. No Provider wrapping needed.

**Why It Matters**: Zustand is the minimal viable global state solution for React Native. Unlike Redux (boilerplate-heavy) or Context API (re-renders all consumers on any state change), Zustand components subscribe to specific slices and re-render only when those slices change. No Provider is needed — the store is module-level singleton. In production apps, Zustand manages UI state (selected tab, modal visibility, user session) while TanStack Query manages server state (fetched data). These two together handle 95% of state management needs.

### Example 40: Zustand with Persistence — MMKV Storage Adapter

Persist Zustand state across app restarts using MMKV as the storage backend via the `persist` middleware.

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
// => react-native-mmkv 4.3.1: synchronous storage, ~30x faster than AsyncStorage

const storage = new MMKV({ id: "app-storage" });
// => id: namespaces this MMKV instance (can have multiple)

const mmkvStorage = {
  // => custom storage adapter: wraps MMKV to match Zustand's storage API
  setItem: (key: string, value: string) => storage.set(key, value),
  // => MMKV.set: synchronous (no await needed)
  getItem: (key: string) => storage.getString(key) ?? null,
  // => MMKV.getString: synchronous read, returns string | undefined
  removeItem: (key: string) => storage.delete(key),
};

type UserPreferences = {
  theme: "light" | "dark" | "system";
  language: string;
  notificationsEnabled: boolean;
  setTheme: (theme: UserPreferences["theme"]) => void;
  setLanguage: (lang: string) => void;
  toggleNotifications: () => void;
};

const usePreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      // => initial state (overwritten by persisted value on next launch)
      theme: "system",
      language: "en",
      notificationsEnabled: true,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleNotifications: () => set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),
    }),
    {
      name: "user-preferences", // => MMKV key to store serialized state
      storage: createJSONStorage(() => mmkvStorage),
      // => createJSONStorage: serializes/deserializes state as JSON
      partialize: (state) => ({
        // => partialize: persist ONLY these keys (exclude actions)
        theme: state.theme,
        language: state.language,
        notificationsEnabled: state.notificationsEnabled,
      }),
    },
  ),
);

export { usePreferencesStore };
// => usage in any component:
// const { theme, setTheme } = usePreferencesStore();
```

**Key Takeaway**: Wrap Zustand with `persist()` middleware and provide an MMKV-backed `storage` adapter. Use `partialize` to persist only state data, not action functions.

**Why It Matters**: User preferences (theme, language, notification settings) must survive app restarts. AsyncStorage's async nature requires `useEffect` + loading state patterns. MMKV's synchronous reads make the persisted state available immediately during the first synchronous render — no loading flash. The Zustand `persist` middleware handles serialization, versioning (via `version` option for migration), and the hydration lifecycle transparently. MMKV's V4 Nitro Module rewrite makes reads 30x faster than AsyncStorage, critical for app startup performance.

### Example 41: MMKV — Synchronous Key-Value Storage

MMKV 4.3.1 provides synchronous storage via its Nitro Module implementation, enabling values readable during the first render.

```typescript
import { MMKV, useMMKVString, useMMKVBoolean, useMMKVNumber } from 'react-native-mmkv';
// => react-native-mmkv 4.3.1: Nitro Module (statically compiled JSI bridge)
// => synchronous: no async/await, no useEffect loading pattern needed

const storage = new MMKV({
  id: 'session-storage',    // => unique storage instance ID
  // => encryptionKey: 'secret' — optional AES-256 encryption
  // => path: custom storage path (default: app sandbox Documents/)
});

// => Direct synchronous API (no hooks)
storage.set('user.id', '12345');                 // => store string (no await)
const userId = storage.getString('user.id');     // => read string synchronously: '12345'

storage.set('onboarding.complete', true);         // => store boolean
const complete = storage.getBoolean('onboarding.complete');  // => true

storage.set('session.version', 3);               // => store number
const version = storage.getNumber('session.version');        // => 3

// => React hooks: subscribe to MMKV changes with re-renders
function SessionIndicator() {
  const [username, setUsername] = useMMKVString('session.username');
  // => useMMKVString: reads from MMKV + re-renders when value changes
  // => username: string | undefined (undefined if key doesn't exist)

  const [isPremium, setIsPremium] = useMMKVBoolean('user.isPremium');
  // => useMMKVBoolean: boolean | undefined

  const [sessionCount, setSessionCount] = useMMKVNumber('session.count');
  // => useMMKVNumber: number | undefined

  return (
    <></>
    // => Components using useMMKV* hooks react to storage changes
    // => Even across components — any write triggers re-renders in all subscribers
  );
}

// => Performance comparison vs AsyncStorage:
// => AsyncStorage.getItem: ~3-5ms async (needs await + loading state)
// => MMKV.getString: ~0.1ms synchronous (available on first render)
// => MMKV ideal for: session tokens, user prefs, draft data, feature flags
// => AsyncStorage acceptable for: large JSON blobs (>100KB), infrequent reads
```

**Key Takeaway**: MMKV reads are synchronous (~0.1ms) — values are available during the first render without loading state. Use `useMMKV*` hooks for reactive component subscriptions. Use raw `storage.get*()` for imperative reads outside components.

**Why It Matters**: MMKV's Nitro Module compiles the storage engine directly into the app binary (no dynamic loading), achieving maximum JSI throughput. Storing session tokens, auth state, and user preferences in MMKV means the app knows whether the user is logged in on the first synchronous render — enabling instant conditional routing (`/onboarding` vs `/home`) without a loading screen. This eliminates the authentication flicker (brief login screen flash before redirect) common in apps using AsyncStorage for auth state.

## Group 12: Device APIs

### Example 42: Camera with expo-camera

`expo-camera` provides camera preview with photo capture and QR code scanning capabilities.

```typescript
import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
// => expo-camera: managed Expo camera API (wraps native camera APIs)
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function CameraDemo() {
  const [permission, requestPermission] = useCameraPermissions();
  // => useCameraPermissions: [PermissionResponse | null, requestFn]
  // => permission.granted: boolean
  // => permission.status: 'granted' | 'denied' | 'undetermined'

  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container}><Text>Checking permissions...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access required</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,            // => 0-1 JPEG quality (0.8 = 80%)
      base64: false,           // => return file URI (true = include base64 string)
      exif: false,             // => omit EXIF metadata
    });
    console.log('Photo URI:', photo?.uri);
    // => photo.uri: file:///private/var/... local file path
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!scanned) {
      setScanned(true);
      console.log('QR Data:', result.data, 'Type:', result.type);
      // => result.data: decoded string content
      // => result.type: 'qr' | 'ean13' | 'ean8' | 'code128' etc.
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}                  // => 'front' | 'back'
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13'],  // => enabled barcode formats
        }}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
        // => undefined: disable scanning after first scan
      />
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={takePicture}>
          <Text style={styles.buttonText}>Capture</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
          <Text style={styles.buttonText}>Flip</Text>
        </Pressable>
        {scanned && (
          <Pressable style={styles.button} onPress={() => setScanned(false)}>
            <Text style={styles.buttonText}>Scan Again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  controls: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  button: { backgroundColor: '#0173B2', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  permissionText: { fontSize: 16, textAlign: 'center', margin: 24 },
});
```

**Key Takeaway**: Use `useCameraPermissions()` to manage camera permission state. Gate camera rendering behind `permission.granted`. Use `cameraRef.current.takePictureAsync()` for capture and `onBarcodeScanned` for QR scanning.

**Why It Matters**: Camera permission UX is a critical trust signal — showing a permission rationale before the OS dialog increases grant rates significantly. `expo-camera` wraps the complex AVFoundation (iOS) and Camera2 (Android) APIs into a unified interface. Always gate the `CameraView` behind permission check — rendering it without permission crashes the app on iOS. For high-performance frame processing (real-time filters, ML inference, AR overlays), see VisionCamera (Example 60-61).

### Example 43: Push Notifications — Handling Delivery

Building on Example 28's setup, handle foreground notifications, badge management, and notification-driven navigation.

```typescript
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

type NotificationData = {
  screen: string; // => target screen to navigate to
  entityId?: string; // => entity ID for dynamic routes
};

export function useNotificationNavigation() {
  // => custom hook: handles notification tap → navigate to screen
  const navigationRef = useRef<boolean>(false);

  useEffect(() => {
    // => 1. Handle notification received while app in FOREGROUND
    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as NotificationData;
      console.log("Foreground notification:", notification.request.content.title);
      // => Show in-app notification banner instead of OS notification
      // => (OS does NOT show banner when app is active foreground)
    });

    // => 2. Handle notification TAP (user taps notification from any app state)
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      if (data?.screen) {
        router.push(data.screen as any);
        // => Navigate to screen specified in notification payload
      }
    });

    // => 3. Handle notification that LAUNCHED the app (app was killed when tapped)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && !navigationRef.current) {
        navigationRef.current = true; // => prevent double navigation
        const data = response.notification.request.content.data as NotificationData;
        if (data?.screen) {
          router.replace(data.screen as any);
          // => replace (not push): cold launch should replace, not add to stack
        }
      }
    });

    return () => {
      foregroundSub.remove(); // => cleanup on unmount
      responseSub.remove();
    };
  }, []);

  const schedulePush = async () => {
    // => Schedule a local notification (no server needed)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "New Message",
        body: "You have a new message from Fatima",
        data: { screen: "/messages", entityId: "123" },
        // => data: arbitrary object attached to notification
        badge: 1, // => iOS badge count
        sound: "default",
      },
      trigger: { seconds: 3 }, // => deliver in 3 seconds
    });
  };

  return { schedulePush };
}
```

**Key Takeaway**: Handle three notification states: foreground (app active), background tap (app backgrounded), and cold launch (app killed). Use `getLastNotificationResponseAsync()` for cold launch detection. Route using `router.push` (tap from background) or `router.replace` (cold launch).

**Why It Matters**: Notification-driven navigation is the primary re-engagement mechanism in mobile apps. Users who tap a notification expect to land directly on the relevant content — a new message, a completed order, an alert. Failing to implement cold-launch handling (when the OS kills the app to free memory) means users who tap a notification from a killed app see the home screen instead of the relevant content. This is a common production bug that significantly impacts retention metrics.

### Example 44: Deep Linking — URL Schemes and Universal Links

Expo Router provides automatic deep link handling. Configure URL scheme in `app.json` and routes receive parameters from external URLs.

```typescript
// app.json
// {
//   "expo": {
//     "scheme": "myapp",
//     "ios": { "associatedDomains": ["applinks:myapp.com"] },
//     "android": { "intentFilters": [...] }
//   }
// }

// Deep link URL: myapp://product/42
// Universal Link: https://myapp.com/product/42
// => Both route to app/(tabs)/product/[id].tsx with params { id: '42' }

import { Linking } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";

export function useDeepLinkHandler() {
  useEffect(() => {
    // => 1. Handle deep link when app is OPEN
    const subscription = Linking.addEventListener("url", ({ url }) => {
      console.log("Deep link received:", url);
      // => Expo Router handles routing automatically via file-based routes
      // => Manual handling needed only for legacy routes or custom schemes
    });

    // => 2. Handle deep link that OPENED the app (cold launch)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("Launched via deep link:", url);
        // => Expo Router processes this automatically
      }
    });

    return () => subscription.remove();
  }, []);
}

// => Opening external URLs from within the app
const openURL = async (url: string) => {
  const canOpen = await Linking.canOpenURL(url);
  // => canOpen: true if device has an app registered for this URL scheme
  if (canOpen) {
    await Linking.openURL(url);
    // => Opens the URL in the default handler (browser, mail app, etc.)
  }
};

// => Examples:
// openURL('https://myapp.com/product/42')   => opens in browser or Universal Link handler
// openURL('mailto:support@myapp.com')       => opens Mail app
// openURL('tel:+1234567890')                => opens Phone app
// openURL('maps:?q=Jakarta,Indonesia')      => opens Maps app
```

**Key Takeaway**: Expo Router automatically handles deep links matching file-based routes. Use `Linking.openURL()` to open external URLs, mail, phone, and other apps. `getInitialURL()` detects cold-launch deep links.

**Why It Matters**: Deep links are essential for marketing campaigns, email links, QR codes, and social sharing. A `myapp://product/42` link in an email opens the app directly on that product page. Universal Links (iOS) and App Links (Android) use HTTPS URLs that fall back to the web browser if the app is not installed — critical for user acquisition where non-app users should land on the web version. Expo Router's file-based routing automatically maps URL paths to screens without manual route registration.

### Example 45: Device Sensors — Accelerometer, Gyroscope

`expo-sensors` provides access to device motion sensors. Useful for step counting, tilt detection, and game input.

```typescript
import { useState, useEffect } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';
// => expo-sensors: unified sensor API across iOS/Android
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

type SensorData = { x: number; y: number; z: number };

export default function SensorDemo() {
  const [accel, setAccel] = useState<SensorData>({ x: 0, y: 0, z: 0 });
  // => accelerometer: linear acceleration in G-force units
  // => x: left/right tilt, y: forward/back tilt, z: up/down (gravity ~1.0)

  const ballX = useSharedValue(0);
  const ballY = useSharedValue(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(16);
    // => 16ms ≈ 60 updates/second (match display refresh rate)

    const subscription = Accelerometer.addListener((data: SensorData) => {
      setAccel(data);

      // => Drive a ball position by tilting the device
      ballX.value = withTiming(data.x * 100, { duration: 50 });
      // => data.x: -1 to 1 range, multiply to pixel movement
      ballY.value = withTiming(-data.y * 100, { duration: 50 });
      // => negate Y: positive tilt forward moves ball up (inverted coordinate)
    });

    return () => subscription.remove();
    // => remove subscription: stop sensor polling on unmount (battery drain!)
  }, []);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: ballX.value }, { translateY: ballY.value }],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tilt your device to move the ball</Text>
      <View style={styles.field}>
        <Animated.View style={[styles.ball, ballStyle]} />
      </View>
      <View style={styles.data}>
        <Text style={styles.axis}>X: {accel.x.toFixed(3)} G</Text>
        <Text style={styles.axis}>Y: {accel.y.toFixed(3)} G</Text>
        <Text style={styles.axis}>Z: {accel.z.toFixed(3)} G</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 },
  title: { fontSize: 16, textAlign: 'center', color: '#555' },
  field: { width: 250, height: 250, backgroundColor: '#e3f2fd', borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  ball: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0173B2' },
  data: { flexDirection: 'row', gap: 16 },
  axis: { fontFamily: 'monospace', fontSize: 14, color: '#333' },
  title: { fontSize: 15, textAlign: 'center', color: '#555' },
});
```

**Key Takeaway**: Subscribe with `Accelerometer.addListener()` and always call `subscription.remove()` in useEffect cleanup. Set `setUpdateInterval()` to control polling frequency — higher rates drain battery faster.

**Why It Matters**: Sensor APIs enable gesture inputs (shake to undo), accessibility features (auto-rotate content), fitness tracking (step counting from accelerometer), and interactive experiences (tilt controls for games or AR). The cleanup pattern is critical — leaving sensor subscriptions running after navigation drains battery continuously. `setUpdateInterval(16)` syncs with the display refresh rate for animation-driven use cases; `setUpdateInterval(1000)` suffices for step counting.

### Example 46: Location Services

`expo-location` accesses GPS and network-based location with foreground and background permission handling.

```typescript
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
// => expo-location: foreground + background location API
import { View, Text, Pressable, StyleSheet } from 'react-native';

type LocationCoords = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;     // => accuracy radius in meters
  speed: number | null;        // => m/s (null if unavailable)
};

export default function LocationDemo() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    // => requestForegroundPermissionsAsync: shows iOS/Android permission dialog
    // => 'granted' | 'denied' | 'undetermined'

    if (status !== 'granted') {
      setError('Location permission denied');
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      // => Location.Accuracy enum:
      // => Lowest(1): ~3km | Low(2): ~1km | Balanced(3): ~100m
      // => High(4): ~10m | Highest(5): ~1m | BestForNavigation(6): <1m (uses A-GPS)
    });
    setLocation(loc.coords as LocationCoords);
  };

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    setIsTracking(true);
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,           // => update every 5 seconds
        distanceInterval: 10,         // => OR when moved 10 meters (whichever comes first)
      },
      (loc) => {
        setLocation(loc.coords as LocationCoords);
      }
    );

    return () => {
      subscription.remove();          // => stop tracking on cleanup
      setIsTracking(false);
    };
  };

  return (
    <View style={styles.container}>
      {location && (
        <View style={styles.locationCard}>
          <Text style={styles.coords}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.meta}>
            Accuracy: {location.accuracy?.toFixed(0)}m
            {location.speed !== null && ` · Speed: ${(location.speed * 3.6).toFixed(1)} km/h`}
          </Text>
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={getLocation}>
        <Text style={styles.buttonText}>Get Location Once</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  locationCard: { backgroundColor: '#e3f2fd', padding: 16, borderRadius: 8 },
  coords: { fontFamily: 'monospace', fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 13, color: '#555', marginTop: 4 },
  error: { color: '#c0392b', textAlign: 'center' },
  button: { backgroundColor: '#0173B2', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
```

**Key Takeaway**: Request foreground permission before any location access. Use `getCurrentPositionAsync` for one-time reads and `watchPositionAsync` for continuous tracking. Set appropriate accuracy to balance precision and battery drain.

**Why It Matters**: Location permission is the most privacy-sensitive API in mobile development. iOS 14+ requires "while using the app" permission before "always" (background), making multi-step permission flows mandatory. Setting `Accuracy.Balanced` uses network triangulation (faster, less battery) while `Accuracy.BestForNavigation` enables A-GPS (slower fix, much more precise) — matching accuracy to use case prevents unnecessary battery drain. Background location (Example 56) requires a separate `requestBackgroundPermissionsAsync()` call and app store reviewer justification.

### Example 47: Haptics — Tactile Feedback

`expo-haptics` provides three levels of haptic feedback using the Taptic Engine (iOS) and vibration motor (Android).

```typescript
import * as Haptics from 'expo-haptics';
// => expo-haptics: iOS Taptic Engine + Android vibration
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function HapticsDemo() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Haptic Feedback</Text>

      {/* => Impact: mechanical tap sensation (most common for buttons) */}
      <Pressable
        style={styles.button}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        // => ImpactFeedbackStyle.Light: subtle tap (link selection, toggle)
      >
        <Text style={styles.buttonText}>Light Impact</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        // => ImpactFeedbackStyle.Medium: moderate tap (button press, swipe)
      >
        <Text style={styles.buttonText}>Medium Impact</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
        // => ImpactFeedbackStyle.Heavy: strong tap (destructive action, hard press)
      >
        <Text style={styles.buttonText}>Heavy Impact</Text>
      </Pressable>

      {/* => Notification: semantic feedback for system events */}
      <Pressable
        style={[styles.button, styles.success]}
        onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
        // => NotificationFeedbackType.Success: three-tap "done" pattern (iOS)
      >
        <Text style={styles.buttonText}>Success Notification</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.error]}
        onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)}
        // => NotificationFeedbackType.Error: two-tap "fail" pattern
      >
        <Text style={styles.buttonText}>Error Notification</Text>
      </Pressable>

      {/* => Selection: discrete value change (like scroll picker click) */}
      <Pressable
        style={[styles.button, styles.secondary]}
        onPress={() => Haptics.selectionAsync()}
        // => selectionAsync: light click for discrete selection changes
      >
        <Text style={styles.buttonText}>Selection Feedback</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  button: { backgroundColor: '#0173B2', padding: 14, borderRadius: 8, alignItems: 'center' },
  success: { backgroundColor: '#029E73' },
  error: { backgroundColor: '#CA9161' },
  secondary: { backgroundColor: '#CC78BC' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
```

**Key Takeaway**: Use `impactAsync(Light/Medium/Heavy)` for button presses, `notificationAsync(Success/Error/Warning)` for operation results, and `selectionAsync()` for discrete selection changes. Haptics run only on physical devices.

**Why It Matters**: Haptic feedback is the tactile layer of mobile UX that distinguishes native apps from web apps. iOS users are conditioned by system apps — the success pattern (three taps) after a payment completion or form submit sets a professional quality signal. Medium impact on swipe-to-delete confirms the destructive action. Over-using haptics (on every list item render, on every state change) trains users to ignore them — use haptics sparingly and semantically for meaningful interactions only.

### Example 48: Keyboard Avoidance

The software keyboard covers screen content. `KeyboardAvoidingView` and Reanimated's `useKeyboardHandler` keep inputs visible.

```typescript
import { KeyboardAvoidingView, ScrollView, TextInput, View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function KeyboardAvoidanceDemo() {
  const [message, setMessage] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // => behavior options:
      // => 'padding': adds bottom padding equal to keyboard height (iOS preferred)
      // => 'height': reduces view height by keyboard height (Android preferred)
      // => 'position': adjusts absolute position (rarely used)
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      // => keyboardVerticalOffset: account for navigation header height
      // => iOS header ~90pt (44pt + safe area top inset); Android typically 0
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        // => allows button taps while keyboard is visible
      >
        {/* => Simulate a chat thread */}
        {Array.from({ length: 10 }, (_, i) => (
          <View key={i} style={[styles.message, i % 2 === 0 ? styles.received : styles.sent]}>
            <Text style={styles.messageText}>Message {i + 1}</Text>
          </View>
        ))}
      </ScrollView>

      {/* => Input bar anchored to keyboard top */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline                          // => expands with content
          maxLength={500}
        />
        <Pressable
          style={styles.sendButton}
          onPress={() => {
            if (message.trim()) {
              console.log('Send:', message);
              setMessage('');
            }
          }}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 12, gap: 8 },
  message: { maxWidth: '70%', padding: 10, borderRadius: 12 },
  received: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  sent: { backgroundColor: '#0173B2', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  messageText: { fontSize: 14 },
  inputBar: { flexDirection: 'row', gap: 8, padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendButton: { backgroundColor: '#0173B2', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 },
  sendText: { color: '#fff', fontWeight: '600' },
});
```

**Key Takeaway**: Use `KeyboardAvoidingView` with `behavior="padding"` on iOS and `behavior="height"` on Android. Set `keyboardVerticalOffset` to account for navigation header height.

**Why It Matters**: Keyboard overlap is one of the most common UI bugs in React Native apps — the soft keyboard covers the input field the user is trying to type in. The `padding` vs `height` behavior difference between iOS and Android is not obvious from the documentation; using `Platform.OS` to select the correct behavior is the production solution. For advanced cases (chat apps with dynamic input height, animated input transitions), Reanimated's `useKeyboardHandler` from `react-native-reanimated` provides frame-accurate keyboard animation driven on the UI thread.

## Group 13: Custom Hooks and Forms

### Example 49: Custom Hooks — useFetch, useDebounce, usePrevious

Custom hooks encapsulate and reuse stateful logic across components. Three essential patterns for mobile development.

```typescript
import { useState, useEffect, useRef, useCallback } from "react";

// => 1. useFetch: generic fetch with loading/error states
function useFetch<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController>();
  // => AbortController: cancel in-flight request when component unmounts

  const fetchData = useCallback(async () => {
    abortControllerRef.current?.abort(); // => cancel previous request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      // => signal: ties fetch to AbortController (abort() cancels this fetch)
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = (await response.json()) as T;
      setData(json);
      setError(null);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        // => AbortError expected on unmount/re-fetch — not a real error
        setError(err as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    return () => abortControllerRef.current?.abort();
    // => cleanup: abort on unmount prevents setState on unmounted component
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// => 2. useDebounce: delay value updates (search input optimization)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value); // => update after delay elapses
    }, delay);
    return () => clearTimeout(timer);
    // => cleanup: cancel pending timer when value or delay changes
    // => result: only fires after user stops typing for 'delay' ms
  }, [value, delay]);

  return debouncedValue;
}

// => 3. usePrevious: track previous render's value (detect direction of change)
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value; // => store current value AFTER render
  });
  // => no dependency array: runs after every render
  return ref.current; // => returns value from PREVIOUS render
  // => On render N: ref.current holds value from render N-1
}

// => Usage example
function SearchScreen() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  // => debouncedQuery: only updates 300ms after user stops typing

  const { data, isLoading } = useFetch<{ results: string[] }>(
    `https://api.example.com/search?q=${debouncedQuery}`,
    undefined,
    // => fetches only when debouncedQuery changes (not on every keystroke)
  );

  const previousQuery = usePrevious(debouncedQuery);
  // => previousQuery: last search term (show "Searching from X to Y")

  return null; // => rendering omitted for brevity
}
```

**Key Takeaway**: Extract reusable stateful logic into custom hooks. `useFetch` with AbortController prevents stale responses. `useDebounce` reduces API calls by waiting for typing pauses. `usePrevious` tracks previous render values.

**Why It Matters**: Custom hooks are React Native's primary mechanism for code reuse without HOC complexity. `useDebounce` on search inputs reduces API calls from 1-per-keystroke to ~1-per-pause, saving network bandwidth and server load. The `AbortController` pattern prevents "setState on unmounted component" warnings that indicate memory leaks — a critical production concern when users navigate quickly and searches race each other. These three hooks appear in virtually every production React Native application.

### Example 50: Form Handling — react-hook-form with zod Validation

`react-hook-form` provides performant form management with minimal re-renders. `zod` provides schema-based validation with TypeScript type inference.

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';

// => zod schema: defines validation rules + derives TypeScript type
const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[0-9]{10,14}$/, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],           // => error appears on confirmPassword field
});

type RegistrationForm = z.infer<typeof registrationSchema>;
// => TypeScript type derived from schema: no separate interface needed

export default function FormDemo() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    // => zodResolver: bridges zod schema to react-hook-form validation
    defaultValues: {
      name: '', email: '', phone: '', password: '', confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegistrationForm) => {
    // => onSubmit: called only when ALL validation passes
    console.log('Valid form data:', data);
    await new Promise(r => setTimeout(r, 1000));  // => simulate API call
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* => Controller: wraps uncontrolled TextInput in react-hook-form */}
      <Controller
        control={control}
        name="name"                           // => matches schema field name
        render={({ field: { onChange, value, onBlur } }) => (
          // => field: { onChange, onBlur, value, name, ref }
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={value}
              onChangeText={onChange}         // => hook form's onChange
              onBlur={onBlur}                 // => marks field as touched
              placeholder="Enter full name"
              placeholderTextColor="#999"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value, onBlur } }) => (
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email"
              placeholderTextColor="#999"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>
        )}
      />

      <Pressable
        style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 4 },
  field: { gap: 4, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15 },
  inputError: { borderColor: '#c0392b' },
  errorText: { fontSize: 12, color: '#c0392b', marginTop: 2 },
  submitButton: { backgroundColor: '#0173B2', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
```

**Key Takeaway**: `useForm` with `zodResolver` validates on submit with type-safe schema. `Controller` adapts uncontrolled form state to React Native's controlled `TextInput`. Errors are accessible from `formState.errors` without manual state management.

**Why It Matters**: Manual form validation logic — tracking which fields have been touched, clearing errors on fix, validating on submit — is brittle and duplicated across forms. `react-hook-form` is performance-optimized to only re-render the changed field's controller, not the entire form. `zod` schemas serve double duty: validation rules at runtime and TypeScript types at compile time, eliminating a separate `interface FormData` declaration. This combination handles the most complex form requirements (cross-field validation, async validation, conditional fields) with minimal code.

## Group 14: Advanced Navigation

### Example 51: Drawer Navigation in Expo Router

The Drawer layout provides a side menu for secondary navigation (settings, profiles, help).

```typescript
// app/_layout.tsx — drawer as root layout
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      {/* => Custom header section above navigation items */}
      <View style={styles.drawerHeader}>
        <Image
          source={require('../assets/avatar.png')}
          style={styles.avatar}
        />
        <Text style={styles.drawerName}>Fatima Al-Zahra</Text>
        <Text style={styles.drawerEmail}>fatima@example.com</Text>
      </View>
      <DrawerItemList {...props} />
      {/* => DrawerItemList: renders the Drawer.Screen items automatically */}
      <DrawerItem
        label="Logout"
        onPress={() => console.log('logout')}
        icon={({ color }) => <Ionicons name="log-out-outline" size={22} color={color} />}
        // => custom item below the auto-generated list
      />
    </DrawerContentScrollView>
  );
}

export default function RootLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: '#0173B2',     // => active item text/icon color
        drawerInactiveTintColor: '#555',
        drawerStyle: { width: 280 },          // => drawer panel width
        headerStyle: { backgroundColor: '#0173B2' },
        headerTintColor: '#fff',
      }}
    >
      <Drawer.Screen
        name="home"                            // => matches app/home.tsx
        options={{
          title: 'Home',
          drawerIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} />,
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerHeader: { padding: 20, backgroundColor: '#e3f2fd', marginBottom: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 8 },
  drawerName: { fontSize: 16, fontWeight: '700' },
  drawerEmail: { fontSize: 13, color: '#666', marginTop: 2 },
});
```

**Key Takeaway**: Use `Drawer` layout from `expo-router/drawer` as the root layout. Provide `drawerContent` for custom headers and additional items. Each `Drawer.Screen` maps to an `app/*.tsx` file.

**Why It Matters**: Drawer navigation is the standard pattern for secondary navigation in Android apps (Google Drive, Gmail) and is common in settings-heavy iOS apps. The custom `DrawerContent` component enables user profile headers, account switching, and logout buttons — UI that doesn't fit in the route-based `Drawer.Screen` list. Expo Router's integration means deep links still work with drawer navigation — a drawer route is a real URL-addressable screen.

### Example 52: Auth Flow — Protected Routes with Expo Router

Protect routes based on authentication state using Expo Router's layout-level redirect pattern.

```typescript
// app/_layout.tsx — root layout with auth guard
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  // => useAuthStore: Zustand store with auth state
  const segments = useSegments();
  // => segments: current route path segments ['(app)', 'home'] or ['(auth)', 'login']
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;              // => wait for auth state to resolve

    const inAuthGroup = segments[0] === '(auth)';
    // => '(auth)' route group: app/(auth)/login.tsx, app/(auth)/register.tsx

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');   // => not logged in, send to login
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/home');    // => logged in, send out of auth group
    }
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthGuard>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        {/* => headerShown: false: auth screens manage their own headers */}
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </AuthGuard>
  );
}
```

```
app/
├── _layout.tsx              # => root layout with AuthGuard
├── (auth)/
│   ├── _layout.tsx          # => auth group layout
│   ├── login.tsx            # => /login route
│   └── register.tsx         # => /register route
└── (app)/
    ├── _layout.tsx          # => app group layout (tab or drawer)
    └── home.tsx             # => /home route (protected)
```

**Key Takeaway**: Use `useSegments()` to detect which route group the user is in. Redirect in `useEffect` to enforce authentication. Route groups `(auth)` and `(app)` organize screens without URL segments.

**Why It Matters**: Authentication routing is one of the most complex aspects of mobile navigation. The `useSegments` pattern prevents flashes where a protected screen briefly renders before the redirect happens. Route groups (folder names in parentheses) cleanly separate authenticated and unauthenticated screen trees. Using `router.replace` (not `router.push`) for auth redirects removes the unauthorized screen from the back stack — users cannot press back to return to the login screen after authenticating, nor return to a protected screen after logging out.

## Group 15: Data and Storage

### Example 53: expo-sqlite — Local SQLite Database

`expo-sqlite` provides a full SQLite database engine for structured local data storage with SQL queries.

```typescript
import * as SQLite from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Task = { id: number; title: string; done: number };
// => done: 0 | 1 (SQLite has no boolean — use INTEGER)

export default function SQLiteDemo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const dbRef = SQLite.useSQLiteContext();
  // => useSQLiteContext: requires <SQLiteProvider> ancestor

  useEffect(() => {
    const initDB = async () => {
      // => CREATE TABLE IF NOT EXISTS: idempotent setup (safe to call multiple times)
      await dbRef.execAsync(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          done INTEGER DEFAULT 0
        );
      `);
      loadTasks();
    };
    initDB();
  }, []);

  const loadTasks = async () => {
    const results = await dbRef.getAllAsync<Task>('SELECT * FROM tasks ORDER BY id DESC');
    // => getAllAsync<T>: returns T[] (all rows as typed objects)
    setTasks(results);
  };

  const addTask = async (title: string) => {
    await dbRef.runAsync(
      'INSERT INTO tasks (title) VALUES (?)',
      title
      // => prepared statement: ? placeholder prevents SQL injection
    );
    // => runAsync: for INSERT/UPDATE/DELETE (no return value needed)
    loadTasks();
  };

  const toggleTask = async (id: number, done: number) => {
    await dbRef.runAsync(
      'UPDATE tasks SET done = ? WHERE id = ?',
      done === 0 ? 1 : 0, id
      // => multiple ? placeholders: values passed as rest args in order
    );
    loadTasks();
  };

  const deleteTask = async (id: number) => {
    await dbRef.runAsync('DELETE FROM tasks WHERE id = ?', id);
    loadTasks();
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.addButton} onPress={() => addTask('New Task ' + Date.now())}>
        <Text style={styles.addButtonText}>+ Add Task</Text>
      </Pressable>
      {tasks.map(task => (
        <View key={task.id} style={styles.task}>
          <Pressable onPress={() => toggleTask(task.id, task.done)} style={styles.taskContent}>
            <Text style={[styles.taskTitle, task.done === 1 && styles.done]}>
              {task.done === 1 ? '✓ ' : '○ '}{task.title}
            </Text>
          </Pressable>
          <Pressable onPress={() => deleteTask(task.id)}>
            <Text style={styles.delete}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// => Wrap app (or screen) with SQLiteProvider:
// <SQLiteProvider databaseName="tasks.db" onInit={initDatabase}>
//   <SQLiteDemo />
// </SQLiteProvider>

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  addButton: { backgroundColor: '#029E73', padding: 14, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  task: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, justifyContent: 'space-between' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 15 },
  done: { textDecorationLine: 'line-through', color: '#999' },
  delete: { color: '#c0392b', fontWeight: '600', paddingLeft: 12 },
});
```

**Key Takeaway**: Use `dbRef.getAllAsync<T>()` for SELECT queries and `dbRef.runAsync()` for INSERT/UPDATE/DELETE. Always use prepared statements (`?` placeholders) to prevent SQL injection. Wrap with `SQLiteProvider` to get the database context.

**Why It Matters**: SQLite is the most powerful local storage option in React Native — full relational data with indexes, transactions, joins, and complex queries. AsyncStorage handles simple key-value pairs; SQLite handles structured data (tasks, messages, cached API responses, offline queues). The `expo-sqlite` API's prepared statements prevent SQL injection — critical even in client-side apps since users could craft input designed to corrupt the local database. WatermelonDB (Example 66) adds reactive ORM on top of SQLite for complex data models with real-time UI updates.

### Example 54: i18n — Internationalization with i18next

Combine `expo-localization` (device locale detection) with `i18next` 25.x and `react-i18next` 16.x for production internationalization.

```typescript
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { View, Text, Pressable, I18nManager, StyleSheet } from 'react-native';

// => i18next initialization (call once in app entry point)
const resources = {
  en: {
    translation: {
      'welcome': 'Welcome, {{name}}!',         // => {{}} interpolation syntax
      'items_count': '{{count}} item',         // => plural: 'item' (singular)
      'items_count_plural': '{{count}} items', // => plural: 'items' (plural, key_plural)
      'settings.title': 'Settings',
      'settings.language': 'Language',
    },
  },
  id: {
    translation: {
      'welcome': 'Selamat datang, {{name}}!',
      'items_count': '{{count}} item',
      'items_count_plural': '{{count}} item',  // => Indonesian: same form for all counts
      'settings.title': 'Pengaturan',
      'settings.language': 'Bahasa',
    },
  },
  ar: {
    translation: {
      'welcome': 'مرحباً، {{name}}!',
      'settings.title': 'الإعدادات',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0]?.languageCode ?? 'en',
    // => Localization.getLocales(): array of device locales in preference order
    // => [0].languageCode: 'en' | 'id' | 'ar' | ...
    fallbackLng: 'en',                    // => use English when translation missing
    interpolation: { escapeValue: false }, // => React handles XSS escaping
  });

function I18nDemo() {
  const { t, i18n } = useTranslation();
  // => t: translation function
  // => i18n: i18next instance (for language switching)

  const isRTL = i18n.dir() === 'rtl';
  // => dir(): 'ltr' | 'rtl' based on current language

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        {t('welcome', { name: 'Fatima' })}
        {/* => en: 'Welcome, Fatima!' | id: 'Selamat datang, Fatima!' */}
      </Text>
      <Text>{t('items_count', { count: 1 })}</Text>
      {/* => en: '1 item' (singular) | id: '1 item' */}
      <Text>{t('items_count', { count: 5 })}</Text>
      {/* => en: '5 items' (plural) | id: '5 item' */}

      <View style={styles.languageButtons}>
        {['en', 'id', 'ar'].map(lang => (
          <Pressable
            key={lang}
            style={[styles.langButton, i18n.language === lang && styles.activeLang]}
            onPress={() => {
              i18n.changeLanguage(lang);
              // => changeLanguage: triggers re-render of all useTranslation() consumers
              if (lang === 'ar') {
                I18nManager.forceRTL(true);   // => force RTL layout for Arabic
                // => IMPORTANT: requires app reload to take full effect on Android
              }
            }}
          >
            <Text style={styles.langText}>{lang.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  welcome: { fontSize: 20, fontWeight: '700' },
  languageButtons: { flexDirection: 'row', gap: 8 },
  langButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#0173B2' },
  activeLang: { backgroundColor: '#0173B2' },
  langText: { fontWeight: '700', color: '#0173B2', fontSize: 13 },
});
```

**Key Takeaway**: Initialize `i18next` with device locale from `Localization.getLocales()`. Use `useTranslation()` hook for `t()` function. Handle RTL layouts with `I18nManager.forceRTL()` for Arabic and Hebrew.

**Why It Matters**: Mobile apps reach global audiences. `expo-localization` detects device language automatically, enabling instant localized experience on first launch. i18next's namespace system organizes translations by feature area, enabling lazy loading (only load translations for the current language, not all). RTL support is particularly important for Arabic (400M speakers) and Hebrew markets. Pluralization rules differ by language — i18next handles English (1 item / N items), Arabic (six plural forms), and Indonesian (no pluralization) through its plural key convention.

### Example 55: Image Picking — expo-image-picker and expo-media-library

Allow users to select photos from their gallery or capture new photos with the camera.

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export default function ImagePickerDemo() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    // => permission: 'granted' | 'denied' | 'limited' (iOS 14+ limited access)
    if (status !== 'granted') {
      console.warn('Gallery permission denied');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],           // => 'images' | 'videos' | 'livePhotos'
      allowsEditing: true,             // => shows cropping UI before selection
      aspect: [4, 3],                  // => aspect ratio for cropping (when allowsEditing: true)
      quality: 0.8,                    // => 0-1 JPEG compression quality
      allowsMultipleSelection: false,  // => single selection
      // => true: returns result.assets[] (array) when multi-select enabled
    });

    if (!result.canceled) {
      // => result.canceled: true when user dismisses picker
      setSelectedImage(result.assets[0].uri);
      // => result.assets[0].uri: local file:// URI of selected image
    }
  };

  const captureFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    // => separate permission: camera access for capture
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],                 // => square crop (profile photo)
      quality: 0.9,
      cameraType: ImagePicker.CameraType.front,  // => front-facing camera
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      await MediaLibrary.saveToLibraryAsync(result.assets[0].uri);
      // => saveToLibraryAsync: saves captured photo to device photo library
      // => Requires MediaLibrary permission (auto-requested on first call)
    }
  };

  return (
    <View style={styles.container}>
      {selectedImage ? (
        <Image
          source={selectedImage}
          style={styles.preview}
          contentFit="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}
      <Pressable style={styles.button} onPress={pickFromGallery}>
        <Text style={styles.buttonText}>Pick from Gallery</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.cameraButton]} onPress={captureFromCamera}>
        <Text style={styles.buttonText}>Capture with Camera</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  preview: { width: '100%', height: 300, borderRadius: 12 },
  placeholder: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed' },
  placeholderText: { color: '#999', fontSize: 16 },
  button: { backgroundColor: '#0173B2', padding: 14, borderRadius: 8, alignItems: 'center' },
  cameraButton: { backgroundColor: '#029E73' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
```

**Key Takeaway**: Use `launchImageLibraryAsync` for gallery selection and `launchCameraAsync` for camera capture. Always request permissions first. Use `MediaLibrary.saveToLibraryAsync` to save captured images to the device photo roll.

**Why It Matters**: Image picking is fundamental to social, e-commerce, and productivity apps. iOS 14+'s "Limited Access" permission (`status === 'limited'`) lets users grant access to specific photos rather than the entire library — apps must handle this gracefully. The `allowsEditing: true` + `aspect` combination adds a cropping step before the image is returned, ensuring profile photos are square and product images match required dimensions. Always use local file URIs for immediate display and upload asynchronously in the background.

### Example 56: Background Tasks — expo-background-fetch

`expo-background-fetch` enables periodic background execution even when the app is not active. Requires `expo-task-manager`.

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
// => expo-background-fetch: OS-scheduled background execution
// => expo-task-manager: task registry (required companion)
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';

const BACKGROUND_FETCH_TASK = 'background-sync-task';
// => Task name: unique string identifier (must match in defineTask + registerAsync)

// => Define task OUTSIDE component (module-level, executed in background JS context)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // => This code runs in background, even when app is closed
    // => Limited to ~30 seconds on iOS, longer on Android
    const data = await fetch('https://api.example.com/sync').then(r => r.json());
    console.log('[Background] Synced:', data);

    return BackgroundFetch.BackgroundFetchResult.NewData;
    // => BackgroundFetchResult: tells OS whether new data was fetched
    // => NewData: OS rewards with more frequent scheduling
    // => NoData: no new content (OS may reduce frequency)
    // => Failed: task failed (OS may reduce frequency)
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default function BackgroundFetchDemo() {
  const [isRegistered, setIsRegistered] = useState(false);

  const registerTask = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    // => status: Available | Restricted | Denied
    // => Restricted: iOS low power mode or parental controls
    // => Denied: user disabled background refresh in iOS Settings

    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
      console.warn('Background fetch not available:', status);
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60,    // => minimum 15 minutes between executions
      // => iOS: OS decides actual interval (may be much longer)
      // => Android: more reliable scheduling via WorkManager
      stopOnTerminate: false,       // => continue after app is killed (Android)
      startOnBoot: true,            // => restart task after device reboot (Android)
    });
    setIsRegistered(true);
  };

  const unregisterTask = async () => {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    setIsRegistered(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        Background Sync: {isRegistered ? 'ACTIVE' : 'INACTIVE'}
      </Text>
      <Text style={styles.note}>
        iOS: OS controls actual sync frequency (respects battery + usage).{'\n'}
        Android: WorkManager provides more reliable scheduling.
      </Text>
      <Pressable style={styles.button} onPress={isRegistered ? unregisterTask : registerTask}>
        <Text style={styles.buttonText}>
          {isRegistered ? 'Disable Background Sync' : 'Enable Background Sync'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  status: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  note: { fontSize: 13, color: '#666', lineHeight: 20, textAlign: 'center', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 },
  button: { backgroundColor: '#0173B2', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
```

**Key Takeaway**: Define tasks at module level with `TaskManager.defineTask`. Register with `BackgroundFetch.registerTaskAsync`. iOS background execution is at OS discretion — return `NewData` to signal activity and encourage more frequent scheduling.

**Why It Matters**: Background sync enables apps to show fresh data immediately on launch without a loading delay — the content is already synced from the background task. Email clients, messaging apps, and news readers depend on background fetch to maintain the illusion of always-fresh data. iOS's discretionary scheduling means apps with consistent NewData returns and high user engagement get more background time — apps that waste background budget with Failed returns or fetch frequently with no new data get throttled. App Store review requires explicit justification of background fetch usage in the privacy manifest.
