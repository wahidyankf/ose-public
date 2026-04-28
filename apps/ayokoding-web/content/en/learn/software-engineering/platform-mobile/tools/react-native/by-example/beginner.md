---
title: "Beginner"
weight: 10000001
date: 2026-04-29T00:00:00+07:00
draft: false
description: "Master fundamental React Native concepts through 28 annotated examples covering project setup, core components, Flexbox layout, Expo Router navigation, and local persistence"
tags: ["react-native", "expo", "mobile", "typescript", "by-example", "beginner", "flexbox", "navigation"]
---

This beginner tutorial covers fundamental React Native + Expo concepts through 28 heavily annotated examples. Each example maintains 1-2.25 comment lines per code line to ensure deep understanding.

## Prerequisites

Before starting, ensure you understand:

- JavaScript ES6+ (arrow functions, destructuring, async/await)
- TypeScript basics (types, interfaces, type inference)
- React fundamentals (components, props, useState, useEffect)
- Basic terminal usage (cd, npm commands)

## Group 1: Project Setup and Configuration

### Example 1: New Expo Project Structure

Creating a new Expo project with `npx create-expo-app` gives you a managed workflow with preconfigured TypeScript, Expo Router, and New Architecture enabled by default.

```bash
npx create-expo-app MyApp --template blank-typescript  # => creates project with TypeScript template
# => Expo SDK 55, React Native 0.83, React 19.2 bundled
# => New Architecture is MANDATORY (legacy bridge dropped)
cd MyApp                                                # => enter project directory
npx expo start                                          # => start Metro bundler (v0.84.3)
# => Press 'i' for iOS Simulator
# => Press 'a' for Android Emulator
# => Scan QR code for physical device via Expo Go
```

After creation, the key directories are:

```
MyApp/
├── app/               # => Expo Router file-based routing (all screens here)
│   └── index.tsx      # => app root screen (maps to '/' route)
├── src/               # => new /src folder structure (Expo SDK 55)
│   └── components/    # => reusable components
├── assets/            # => fonts, images, icons
├── app.json           # => Expo configuration (name, icon, splash, plugins)
├── tsconfig.json      # => TypeScript configuration (strict mode)
└── package.json       # => dependencies + npm scripts
```

**Key Takeaway**: `npx create-expo-app` bootstraps a production-ready project with TypeScript, Expo Router, and New Architecture already configured. No manual setup required.

**Why It Matters**: The managed Expo workflow means you write TypeScript, Expo handles native build tooling. You never touch Xcode project files or Android Gradle files for standard use cases. EAS Build compiles native binaries in the cloud. This dramatically reduces the operational overhead of shipping to both iOS and Android simultaneously. Understanding the project structure from the start prevents confusion when adding new screens, assets, or native plugins.

### Example 2: TypeScript Configuration for React Native

Expo projects ship with TypeScript in strict mode. Path aliases let you avoid relative import hell across deeply nested files.

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-native",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@stores/*": ["src/stores/*"]
    },
    "allowJs": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "extends": "expo/tsconfig.base"
}
```

Metro bundler also needs to know about path aliases:

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true); // => cache babel config for faster rebuilds
  return {
    presets: ["babel-preset-expo"], // => Expo's preset (includes JSX, TypeScript)
    plugins: [
      [
        "module-resolver", // => babel-plugin-module-resolver
        {
          root: ["."], // => project root for resolution
          alias: {
            "@": "./src", // => @/components → src/components
            "@components": "./src/components", // => granular alias for common folders
            "@hooks": "./src/hooks",
            "@stores": "./src/stores",
          },
        },
      ],
    ],
  };
};
```

**Key Takeaway**: Configure `paths` in `tsconfig.json` and matching `alias` in `babel.config.js` together. Metro needs both: TypeScript for type checking, Babel for runtime module resolution.

**Why It Matters**: Without path aliases, deeply nested components import with fragile relative paths like `../../../../components/Button`. Path aliases make imports readable (`@components/Button`) and refactor-safe. Strict TypeScript mode catches null pointer errors, missing props, and type mismatches at compile time rather than as production crashes on user devices. These configurations set the quality baseline for the entire application.

## Group 2: Core UI Components

### Example 3: View and Text — Base Building Blocks

`View` is the fundamental layout container (equivalent to `<div>`). `Text` is required for all visible text — you cannot render a bare string outside `<Text>`.

```typescript
import { View, Text, StyleSheet } from 'react-native';  // => core RN components
                                                          // => NOT from 'react-dom'

export default function HomeScreen() {
  return (
    // => View: the universal container, maps to UIView (iOS) / android.view.View
    <View style={styles.container}>
      {/* => Text: ALL text must be inside <Text>, bare strings cause runtime errors */}
      <Text style={styles.title}>Welcome to React Native</Text>
      {/* => Output: native UILabel / TextView, NOT an <h1> DOM element */}

      <Text style={styles.subtitle}>
        Cross-platform mobile development
      </Text>
      {/* => Text supports nesting: inner Text inherits parent styles */}

      <View style={styles.card}>
        {/* => Views nest freely to create layouts */}
        <Text style={styles.cardText}>Card content</Text>
        {/* => No <p>, <span>, <div> — only View + Text in RN */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({          // => creates optimized, validated StyleSheet
  container: {                              // => root container
    flex: 1,                                // => fills all available screen space
    padding: 20,                            // => 20 logical pixels on all sides
    backgroundColor: '#fff',               // => white background
  },
  title: {
    fontSize: 24,                           // => 24pt text (no 'px', RN uses pts)
    fontWeight: 'bold',                     // => bold weight
    marginBottom: 8,                        // => 8pt gap below title
  },
  subtitle: {
    fontSize: 16,
    color: '#666',                          // => medium gray
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f5f5f5',            // => light gray card background
    borderRadius: 8,                        // => rounded corners
    padding: 16,
  },
  cardText: {
    fontSize: 14,
  },
});
```

**Key Takeaway**: `View` contains layout, `Text` contains all visible text. There is no HTML — every component maps directly to a platform-native widget.

**Why It Matters**: React Native's constraint that all text must be inside `<Text>` is enforced at runtime. Violating it crashes the app. Understanding this early prevents debugging confusion. The direct mapping to native widgets means your UI renders at 60-120fps with platform-native accessibility, animations, and interaction patterns — something web views inside hybrid apps cannot match. This native rendering is the core value proposition of React Native over alternatives like Capacitor or Cordova.

### Example 4: StyleSheet.create() — Typed Styles and CSS Differences

`StyleSheet.create()` validates styles at development time and optimizes them into an internal registry. Styles are plain JavaScript objects — not CSS strings.

```typescript
import { View, Text, StyleSheet, Platform } from 'react-native';
// => Platform: detects 'ios' | 'android' | 'web' | 'windows' | 'macos'

export default function StyleDemo() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Styled Text</Text>

      {/* => Multiple styles: pass array, last wins for conflicts */}
      <Text style={[styles.text, styles.highlighted]}>
        Bold + Highlighted
      </Text>

      {/* => Inline styles work but bypass StyleSheet optimization */}
      <Text style={{ fontSize: 12, color: 'red' }}>
        Inline style (avoid in production)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontSize: 16,                           // => number (logical pixels), NOT '16px'
    color: '#333',
    lineHeight: 24,                         // => line height as number
    // => NO 'display: block' — View/Text are always block
    // => NO 'float' — use Flexbox instead
    // => NO 'position: fixed' — use 'absolute' + SafeAreaInsets
  },
  highlighted: {
    backgroundColor: '#fff3cd',            // => yellow highlight
    fontWeight: '700',                      // => bold (use string '700' not number)
    borderRadius: 4,
    paddingHorizontal: 4,                   // => shorthand: padding left + right
    paddingVertical: 2,                     // => shorthand: padding top + bottom
  },
});

// => StyleSheet.absoluteFill: fills parent with position:absolute + top/left/right/bottom = 0
// => CRITICAL: StyleSheet.absoluteFillObject was REMOVED in RN 0.85 — use absoluteFill
const overlayStyle = StyleSheet.absoluteFill;  // => correct for RN 0.85+
```

**Key Takeaway**: Styles are JavaScript objects with numeric values (no `px`). Use `StyleSheet.create()` for validation and optimization. Array styles merge with last-wins. `absoluteFillObject` is removed in 0.85 — use `absoluteFill`.

**Why It Matters**: `StyleSheet.create()` validates style properties at development time, catching typos like `fontweigth` immediately rather than silently doing nothing. The style registry optimization reduces bridge traffic. Understanding that RN styles are a subset of CSS — no floats, no display types, no CSS cascade — prevents frustration when CSS muscle memory produces unexpected results. Numeric values without units follow density-independent pixel conventions that work consistently across screen densities.

### Example 5: Flexbox Layout — Column-Default and Axis Controls

React Native Flexbox is almost identical to CSS Flexbox with one critical difference: `flexDirection` defaults to `'column'`, not `'row'`.

```typescript
import { View, Text, StyleSheet } from 'react-native';

export default function FlexDemo() {
  return (
    <View style={styles.screen}>
      {/* => flexDirection: 'column' (DEFAULT) — children stack vertically */}
      <View style={styles.columnContainer}>
        <View style={styles.box}><Text>1</Text></View>
        <View style={styles.box}><Text>2</Text></View>
        <View style={styles.box}><Text>3</Text></View>
        {/* => Boxes stacked top-to-bottom (column) */}
      </View>

      {/* => flexDirection: 'row' — children line up horizontally */}
      <View style={styles.rowContainer}>
        <View style={styles.box}><Text>A</Text></View>
        <View style={styles.box}><Text>B</Text></View>
        <View style={styles.box}><Text>C</Text></View>
        {/* => Boxes arranged left-to-right (row) */}
      </View>

      {/* => justifyContent controls main axis, alignItems controls cross axis */}
      <View style={styles.centeredRow}>
        <View style={styles.box}><Text>X</Text></View>
        {/* => justifyContent: 'center' → centered on main axis (horizontal for row) */}
        {/* => alignItems: 'center' → centered on cross axis (vertical for row) */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // => flex: 1 means "take up remaining space proportionally"
    // => flexDirection defaults to 'column' here (children stack vertically)
    padding: 16,
    gap: 16,                                // => gap between flex children (since RN 0.71)
  },
  columnContainer: {
    flexDirection: 'column',               // => explicit column (same as default)
    backgroundColor: '#e3f2fd',
    padding: 8,
    gap: 4,                                // => 4pt gap between column children
  },
  rowContainer: {
    flexDirection: 'row',                  // => override default to row
    backgroundColor: '#f3e5f5',
    padding: 8,
    gap: 8,
  },
  centeredRow: {
    flexDirection: 'row',
    justifyContent: 'center',             // => main axis (horizontal): center
    alignItems: 'center',                 // => cross axis (vertical): center
    backgroundColor: '#e8f5e9',
    height: 60,
  },
  box: {
    width: 40,
    height: 40,
    backgroundColor: '#0173B2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
});
```

**Key Takeaway**: React Native Flexbox defaults to `flexDirection: 'column'`. Main axis = flexDirection direction; cross axis = perpendicular. `justifyContent` controls main axis; `alignItems` controls cross axis.

**Why It Matters**: The column-default is the single most common source of confusion for web developers moving to React Native. In CSS, `display: flex` defaults to row — vertical stacking requires `flex-direction: column`. In React Native, the opposite. Internalize this difference immediately. The Yoga layout engine underlying RN implements a high-performance Flexbox in native Kotlin (as of RN 0.85 on Android), meaning layouts are computed on the native thread without JavaScript involvement — enabling 60fps UI that stays smooth even under heavy JS load.

### Example 6: gap, rowGap, columnGap in Flexbox

`gap`, `rowGap`, and `columnGap` eliminate the need for manual margin hacks between flex children. Available since React Native 0.71.

```typescript
import { View, StyleSheet, Text } from 'react-native';

export default function GapDemo() {
  const items = ['A', 'B', 'C', 'D', 'E', 'F'];
  // => 6 items to demonstrate gap in a wrapping grid

  return (
    <View style={styles.container}>
      {/* => gap: uniform spacing between ALL flex children */}
      <Text style={styles.label}>gap: 12 (uniform)</Text>
      <View style={styles.uniformGap}>
        {items.map(item => (
          <View key={item} style={styles.chip}>
            {/* => key prop required for list rendering */}
            <Text style={styles.chipText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* => rowGap + columnGap: independent control */}
      <Text style={styles.label}>rowGap: 4, columnGap: 16</Text>
      <View style={styles.customGap}>
        {items.map(item => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 24,                   // => 24pt between the two demo sections
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  uniformGap: {
    flexDirection: 'row',
    flexWrap: 'wrap',           // => items wrap to next line when no space
    gap: 12,                    // => 12pt between ALL children (row + column)
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  customGap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,                  // => 4pt vertical gap between rows
    columnGap: 16,              // => 16pt horizontal gap between columns
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  chip: {
    backgroundColor: '#0173B2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**Key Takeaway**: Use `gap` for uniform spacing, `rowGap`/`columnGap` for independent axis control. This is cleaner than applying `marginRight`/`marginBottom` to every child.

**Why It Matters**: Before `gap` support (pre-RN 0.71), developers applied margin to every child then removed it from the last child with index-based logic — fragile and verbose. `gap` is now the idiomatic way to space flex children. It works with `flexWrap: 'wrap'` for grid-like layouts without a dedicated grid component. Production UIs use gap extensively for chip lists, button groups, card grids, and tag displays. Understanding gap keeps layout code declarative and maintainable.

### Example 7: Image and ImageBackground

`Image` renders local and remote images. `ImageBackground` wraps children over an image background. Use `expo-image` for production (better caching and blurhash placeholders).

```typescript
import { View, Image, ImageBackground, Text, StyleSheet } from 'react-native';

export default function ImageDemo() {
  const remoteUri = 'https://picsum.photos/200/150';
  // => remote image URL (fetched at runtime, cached by RN)

  return (
    <View style={styles.container}>
      {/* => Local image: require() resolves at bundle time */}
      <Image
        source={require('../assets/logo.png')}  // => relative path from component file
        style={styles.logo}                      // => explicit dimensions required
        resizeMode="contain"                     // => fit within bounds, preserve ratio
        // => resizeMode options: 'cover'|'contain'|'stretch'|'repeat'|'center'
      />

      {/* => Remote image: source with uri string */}
      <Image
        source={{ uri: remoteUri }}             // => uri object for remote images
        style={styles.remote}
        resizeMode="cover"                      // => fill bounds, crop if needed
        onLoad={() => console.log('loaded')}    // => fires when image data decoded
        onError={(e) => console.warn(e.nativeEvent.error)}  // => handles 404, network errors
        defaultSource={require('../assets/placeholder.png')} // => shows while loading (iOS only)
      />

      {/* => ImageBackground: image as background with children on top */}
      <ImageBackground
        source={{ uri: remoteUri }}
        style={styles.hero}
        resizeMode="cover"
        // => children rendered over image in absolute positioning
      >
        <Text style={styles.heroText}>Overlay Text</Text>
        {/* => Text positioned over image via Flexbox centering */}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  logo: {
    width: 100,
    height: 100,               // => Image requires explicit width + height
    alignSelf: 'center',       // => center within parent (cross axis)
  },
  remote: {
    width: '100%',             // => percentage strings supported
    height: 150,
    borderRadius: 8,
  },
  hero: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    justifyContent: 'flex-end', // => push children to bottom of hero
    alignItems: 'center',
    overflow: 'hidden',         // => clip image to borderRadius
  },
  heroText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.4)', // => semi-transparent backdrop
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
    borderRadius: 4,
  },
});
```

**Key Takeaway**: `Image` requires explicit `width` and `height` styles. Use `require()` for local assets (resolved at bundle time) and `{ uri: string }` for remote images (fetched at runtime).

**Why It Matters**: React Native images have no intrinsic size fallback — without explicit dimensions, the image renders as 0x0 and is invisible. This surprises developers coming from web. Production apps use `expo-image` (Example 26) which adds blurhash placeholders, disk caching, and progressive loading. Understanding the basic `Image` API first makes `expo-image`'s optimization benefits concrete. Remote images need error handling — network failures, CDN outages, and missing assets are runtime events that must be caught.

### Example 8: TextInput — Controlled Inputs

`TextInput` is the primary text entry component. React Native uses controlled input patterns identical to React web, with mobile-specific props for keyboard type and return key behavior.

```typescript
import { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

export default function TextInputDemo() {
  const [email, setEmail] = useState('');       // => controlled: state drives value
  const [password, setPassword] = useState('');  // => separate state for each input
  const [search, setSearch] = useState('');

  return (
    <View style={styles.container}>
      {/* => Email input: keyboard optimized for email entry */}
      <TextInput
        style={styles.input}
        value={email}                             // => controlled: displays state value
        onChangeText={setEmail}                   // => updates state on every keystroke
        placeholder="Email address"               // => shown when empty
        placeholderTextColor="#999"               // => explicit color (differs across platforms)
        keyboardType="email-address"              // => shows @/. on keyboard
        autoCapitalize="none"                     // => no auto-capitalize for emails
        autoCorrect={false}                       // => disable autocorrect for emails
        returnKeyType="next"                      // => "Next" button on keyboard (go to next field)
      />

      {/* => Password input: hides characters */}
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry={true}                    // => hides characters (••••)
        returnKeyType="done"                      // => "Done" button on keyboard
        onSubmitEditing={() => console.log('submitted')}
        // => fires when user presses the return key
      />

      {/* => Search input: with clear button */}
      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Search..."
        placeholderTextColor="#999"
        clearButtonMode="while-editing"           // => iOS only: X button when typing
        returnKeyType="search"                    // => "Search" label on keyboard
      />

      <Text style={styles.preview}>
        Email: {email || '(empty)'}
        {'\n'}
        Search: {search || '(empty)'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  preview: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
```

**Key Takeaway**: Use `value` + `onChangeText` for controlled inputs. Set `keyboardType`, `autoCapitalize`, `autoCorrect`, and `returnKeyType` for mobile-appropriate keyboard UX.

**Why It Matters**: Mobile keyboards are context-sensitive — showing a numeric keypad for phone numbers, email keyboard for addresses, and URL keyboard for web fields dramatically reduces user error. `returnKeyType` lets users flow between fields without dismissing the keyboard. `secureTextEntry` triggers iOS Secure Text Entry and Android password masking. These details are invisible on desktop web but profoundly affect mobile form completion rates and perceived app quality.

### Example 9: TouchableOpacity vs Pressable

`Pressable` is the modern, flexible tap target. `TouchableOpacity` is the classic alternative with built-in opacity animation feedback.

```typescript
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';

export default function PressDemo() {
  const handlePress = (label: string) => {
    console.log(`${label} pressed`);  // => logs to Metro terminal / debugger
  };

  return (
    <View style={styles.container}>
      {/* => TouchableOpacity: dims to ~0.2 opacity on press (classic RN) */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => handlePress('TouchableOpacity')}  // => fires on finger release
        activeOpacity={0.7}                              // => opacity during press (0-1)
      >
        <Text style={styles.buttonText}>TouchableOpacity</Text>
      </TouchableOpacity>

      {/* => Pressable: modern, supports complex press states via style function */}
      <Pressable
        style={({ pressed }) => [     // => style can be function receiving press state
          styles.button,
          pressed && styles.buttonPressed,   // => apply extra style when pressed
          // => pressed is true between finger down and finger up
        ]}
        onPress={() => handlePress('Pressable')}
        onPressIn={() => console.log('finger down')}   // => fires on finger touch
        onPressOut={() => console.log('finger up')}   // => fires on finger release
        onLongPress={() => handlePress('long press')} // => fires after 500ms hold
        hitSlop={10}                                  // => expand tap area by 10pt all sides
        // => hitSlop is critical for small touch targets (accessibility)
      >
        {({ pressed }) => (
          // => children can also be a render function
          <Text style={[styles.buttonText, pressed && { color: '#aaa' }]}>
            {pressed ? 'Pressing...' : 'Pressable'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#0173B2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#005a9e',  // => darker blue when pressed
    transform: [{ scale: 0.98 }],  // => subtle shrink animation
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Key Takeaway**: Prefer `Pressable` for new code — it provides more control over press states through style functions and render props. Use `TouchableOpacity` when a simple opacity fade suffices.

**Why It Matters**: Touch targets that provide immediate visual feedback drastically reduce perceived latency and increase perceived responsiveness. Apple's Human Interface Guidelines and Google's Material Design both mandate minimum 44pt tap areas. `hitSlop` expands the tap detection area without changing visual size — critical for small icons and buttons in navigation bars. `Pressable`'s render function pattern lets you build complex interactive states (hover, focus, press) that match platform conventions across iOS and Android without duplicating state management.

### Example 10: ScrollView — Simple Scrollable Content

`ScrollView` renders all children at once, making it suitable for small amounts of content. For long lists use `FlatList` (Example 11).

```typescript
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useState } from 'react';

export default function ScrollDemo() {
  const [refreshing, setRefreshing] = useState(false);
  // => controls pull-to-refresh spinner

  const onRefresh = async () => {
    setRefreshing(true);                    // => show spinner
    await new Promise(r => setTimeout(r, 1500));  // => simulate network request
    setRefreshing(false);                   // => hide spinner
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      // => contentContainerStyle styles the inner content view (NOT the scroll container)
      showsVerticalScrollIndicator={false}  // => hide scrollbar on iOS
      keyboardShouldPersistTaps="handled"   // => taps dismiss keyboard BUT still fire onPress
      // => 'handled' = let Pressable/TouchableOpacity handle the tap
      // => 'always' = taps never dismiss keyboard
      // => 'never' = taps dismiss keyboard (default, breaks button presses when keyboard open)
      refreshControl={
        // => pull-to-refresh control
        <RefreshControl
          refreshing={refreshing}           // => drives spinner visibility
          onRefresh={onRefresh}             // => called when user pulls down
          tintColor="#0173B2"               // => spinner color (iOS)
          colors={['#0173B2']}              // => spinner color(s) (Android)
        />
      }
    >
      {Array.from({ length: 20 }, (_, i) => (
        // => generates 20 card items
        <View key={i} style={styles.card}>
          <Text style={styles.cardTitle}>Card {i + 1}</Text>
          <Text style={styles.cardBody}>
            ScrollView renders ALL items simultaneously — great for &lt;50 items,
            use FlatList for longer lists.
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,                    // => fill screen height
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,                // => padding applied to inner content view
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,               // => Android shadow (iOS uses shadow* props)
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
```

**Key Takeaway**: `ScrollView` renders all children into memory at once. Use `contentContainerStyle` for padding/gap inside the scroll area. Always set `keyboardShouldPersistTaps="handled"` when the scroll view contains tappable elements alongside inputs.

**Why It Matters**: The `keyboardShouldPersistTaps` gotcha causes widespread confusion in production apps — tapping a button while the keyboard is open dismisses the keyboard instead of triggering the button action, requiring a second tap. Setting `"handled"` fixes this. `RefreshControl` provides the pull-to-refresh pattern users expect from native apps. Understanding when ScrollView is appropriate (static/small content) versus when to use FlatList (dynamic/large lists) is critical for performance — ScrollView with 1000 items will crash or freeze the app.

### Example 11: FlatList — Virtualized Lists

`FlatList` renders only the visible items plus a configurable buffer, keeping memory usage constant regardless of list length.

```typescript
import { FlatList, View, Text, StyleSheet, ListRenderItemInfo } from 'react-native';

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

const PRODUCTS: Product[] = Array.from({ length: 100 }, (_, i) => ({
  id: `product-${i}`,             // => unique string ID (required for keyExtractor)
  name: `Product ${i + 1}`,
  price: Math.round(Math.random() * 10000) / 100,
  category: i % 3 === 0 ? 'Electronics' : i % 3 === 1 ? 'Clothing' : 'Food',
}));

function ProductItem({ item }: { item: Product }) {
  // => extracted component prevents anonymous function in renderItem
  // => anonymous renderItem functions break FlatList memoization
  return (
    <View style={styles.item}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      <Text style={styles.category}>{item.category}</Text>
    </View>
  );
}

export default function FlatListDemo() {
  return (
    <FlatList
      data={PRODUCTS}                            // => array of items to render
      keyExtractor={(item) => item.id}           // => unique key for each item
      renderItem={({ item }: ListRenderItemInfo<Product>) => (
        <ProductItem item={item} />
      )}
      // => only visible items + buffer rendered (virtualization)
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      // => renders between items (not after last)
      ListHeaderComponent={
        <Text style={styles.header}>100 Products</Text>
      }
      // => rendered at top of list (not scrolled off)
      ListEmptyComponent={
        <Text style={styles.empty}>No products found</Text>
      }
      // => shown when data array is empty
      contentContainerStyle={styles.content}
      initialNumToRender={10}                    // => render 10 items on initial mount
      maxToRenderPerBatch={10}                   // => render 10 items per scroll batch
      windowSize={5}                             // => render 5 screen-heights of items
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    color: '#029E73',
    marginTop: 4,
  },
  category: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  separator: {
    height: 8,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: 32,
  },
});
```

**Key Takeaway**: `FlatList` virtualizes large datasets — only visible items exist in memory. Always provide `keyExtractor` with a unique string. Extract `renderItem` components to avoid breaking memoization.

**Why It Matters**: Rendering 1000 items in ScrollView allocates memory for all 1000 simultaneously, causing 60fps frame drops or out-of-memory crashes on lower-end Android devices. FlatList's virtualization keeps memory at a constant level regardless of list size. The `keyExtractor` is critical — without it, React cannot efficiently diff and update list items, causing entire list re-renders on any state change. For even better performance with large lists, see FlashList (Example 35) which reduces re-renders by 5-10x through its recycler pool pattern.

### Example 12: SectionList — Grouped Data with Headers

`SectionList` extends FlatList with section headers for grouped data (contacts, dates, categories).

```typescript
import { SectionList, View, Text, StyleSheet, SectionListData } from 'react-native';

type Contact = { id: string; name: string; phone: string };
type Section = SectionListData<Contact, { title: string }>;

const SECTIONS: Section[] = [
  {
    title: 'A',
    data: [
      { id: '1', name: 'Ahmed Hassan', phone: '+62 812 3456 7890' },
      { id: '2', name: 'Aisha Patel', phone: '+62 813 9876 5432' },
    ],
  },
  {
    title: 'F',
    data: [
      { id: '3', name: 'Fatima Al-Zahra', phone: '+62 822 1111 2222' },
    ],
  },
  {
    title: 'M',
    data: [
      { id: '4', name: 'Muhammad Ali', phone: '+62 856 3333 4444' },
      { id: '5', name: 'Mia Chen', phone: '+62 877 5555 6666' },
    ],
  },
];

export default function SectionListDemo() {
  return (
    <SectionList
      sections={SECTIONS}                          // => array of {title, data[]} objects
      keyExtractor={(item) => item.id}             // => unique key per item
      renderItem={({ item }) => (
        // => renderItem renders each data item within a section
        <View style={styles.item}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>{item.phone}</Text>
        </View>
      )}
      renderSectionHeader={({ section }) => (
        // => renderSectionHeader renders the title row for each section
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {/* => section.title comes from the 'title' field in SECTIONS */}
        </View>
      )}
      stickySectionHeadersEnabled={true}           // => headers stay visible during scroll (iOS default: true)
      ItemSeparatorComponent={() => (
        <View style={styles.separator} />
      )}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  sectionHeader: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0173B2',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  item: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  name: {
    fontSize: 16,
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 16,
  },
});
```

**Key Takeaway**: `SectionList` takes `sections: [{ title, data[] }]` and renders `renderSectionHeader` for each section title and `renderItem` for each item. Sticky headers keep context visible while scrolling long grouped lists.

**Why It Matters**: Grouped lists (contacts by letter, transactions by date, products by category) are fundamental mobile UI patterns. `SectionList` handles the rendering, virtualization, and sticky header mechanics natively — implementing this from scratch with ScrollView would require custom scroll event listeners, header position tracking, and manual virtualization. `stickySectionHeadersEnabled` uses native sticky positioning (UITableView on iOS) for 60fps smooth behavior.

## Group 3: Overlays and Feedback

### Example 13: Modal — Overlay Dialogs

`Modal` renders content on top of the app without navigating away. Use it for confirmations, sheets, and lightweight overlays.

```typescript
import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';

export default function ModalDemo() {
  const [visible, setVisible] = useState(false);
  // => drives modal open/close state

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.openButton}
        onPress={() => setVisible(true)}     // => open modal on press
      >
        <Text style={styles.buttonText}>Open Modal</Text>
      </Pressable>

      <Modal
        visible={visible}                    // => controlled by state
        transparent={true}                   // => background shows through
        animationType="fade"                 // => 'none' | 'slide' | 'fade'
        onRequestClose={() => setVisible(false)}
        // => Android back button handler (required on Android)
        statusBarTranslucent={true}          // => modal covers status bar (Android)
      >
        {/* => Outer View: semi-transparent backdrop */}
        <View style={styles.backdrop}>
          {/* => Inner View: the actual dialog card */}
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Confirm Action</Text>
            <Text style={styles.dialogBody}>
              Are you sure you want to proceed? This cannot be undone.
            </Text>

            <View style={styles.dialogButtons}>
              <Pressable
                style={[styles.dialogButton, styles.cancelButton]}
                onPress={() => setVisible(false)}  // => close modal
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogButton, styles.confirmButton]}
                onPress={() => {
                  console.log('confirmed');
                  setVisible(false);               // => close after confirm
                }}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openButton: {
    backgroundColor: '#0173B2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',  // => semi-transparent black
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  dialogBody: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  dialogButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#0173B2',
  },
  cancelText: {
    color: '#333',
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**Key Takeaway**: `Modal` with `transparent={true}` + semi-transparent backdrop creates dialog overlays. Always handle `onRequestClose` for Android back button support.

**Why It Matters**: `Modal` renders above the navigation stack, making it independent of the current route. Forgetting `onRequestClose` on Android causes the back button to do nothing, trapping users in the modal — a critical UX bug. `animationType="slide"` creates a bottom sheet feel. Production apps often combine Modal with gesture-based dismissal (pan down to close) from Reanimated, covered in Example 64.

### Example 14: ActivityIndicator and Loading States

`ActivityIndicator` displays a platform-native spinner. Combine with conditional rendering to show loading and empty states.

```typescript
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useState, useEffect } from 'react';

type DataState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; message: string };
// => discriminated union: exhaustive type-safe state machine

export default function LoadingDemo() {
  const [state, setState] = useState<DataState>({ status: 'idle' });

  const fetchData = async () => {
    setState({ status: 'loading' });           // => show spinner
    try {
      await new Promise(r => setTimeout(r, 1500));  // => simulate 1.5s network request
      setState({
        status: 'success',
        data: ['Result A', 'Result B', 'Result C'],
      });
    } catch (error) {
      setState({ status: 'error', message: 'Network request failed' });
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={fetchData}>
        <Text style={styles.buttonText}>Load Data</Text>
      </Pressable>

      {state.status === 'idle' && (
        <Text style={styles.hint}>Press the button to load data</Text>
      )}

      {state.status === 'loading' && (
        // => conditional render: shows spinner during fetch
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"              // => 'small' | 'large'
            color="#0173B2"           // => spinner color
          />
          <Text style={styles.loadingText}>Fetching data...</Text>
        </View>
      )}

      {state.status === 'success' && (
        <View style={styles.results}>
          {state.data.map((item, i) => (
            <Text key={i} style={styles.resultItem}>• {item}</Text>
          ))}
        </View>
      )}

      {state.status === 'error' && (
        <Text style={styles.errorText}>{state.message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    backgroundColor: '#0173B2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  results: {
    gap: 8,
  },
  resultItem: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  errorText: {
    color: '#c0392b',
    textAlign: 'center',
    padding: 16,
  },
  hint: {
    color: '#999',
    textAlign: 'center',
  },
});
```

**Key Takeaway**: Model loading state as a discriminated union (`idle | loading | success | error`) and render each state conditionally. `ActivityIndicator` gives a native platform spinner for the `loading` branch.

**Why It Matters**: Discriminated union state types prevent impossible state combinations — you cannot have both `loading: true` and `error: 'message'` simultaneously when state is a single union. TypeScript exhaustive checks catch missing branches at compile time. The native `ActivityIndicator` uses `UIActivityIndicatorView` on iOS and `ProgressBar` on Android — users see familiar platform-native loading indicators rather than custom animations that look out of place.

### Example 15: Alert and Platform Dialogs

`Alert.alert()` shows native platform dialogs. `ActionSheetIOS` shows iOS-specific action sheets. Both are imperative APIs, not components.

```typescript
import { View, Text, Pressable, Alert, StyleSheet, Platform, ActionSheetIOS } from 'react-native';

export default function AlertDemo() {
  const showBasicAlert = () => {
    Alert.alert(
      'Alert Title',                   // => first arg: title
      'This is the alert message.',    // => second arg: body text
      // => third arg: array of buttons (optional)
    );
    // => shows native UIAlertController (iOS) / AlertDialog (Android)
  };

  const showConfirmAlert = () => {
    Alert.alert(
      'Delete Item?',
      'This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',               // => gray/default styling, no action
          onPress: () => console.log('cancelled'),
        },
        {
          text: 'Delete',
          style: 'destructive',          // => red text on iOS, same as default on Android
          onPress: () => console.log('deleted'),
        },
      ],
      { cancelable: true }               // => Android: dismiss by tapping outside
    );
  };

  const showActionSheet = () => {
    if (Platform.OS === 'ios') {
      // => ActionSheetIOS: iOS-only bottom sheet
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Share', 'Edit', 'Delete'],
          cancelButtonIndex: 0,           // => index of Cancel button (appears separately)
          destructiveButtonIndex: 3,      // => index of destructive button (red text)
          title: 'Item Options',
          message: 'Choose an action',
        },
        (buttonIndex) => {
          // => buttonIndex: 0=Cancel, 1=Share, 2=Edit, 3=Delete
          if (buttonIndex === 1) console.log('share');
          if (buttonIndex === 2) console.log('edit');
          if (buttonIndex === 3) console.log('delete');
        }
      );
    } else {
      // => Android: use Alert.alert() with multiple buttons as fallback
      Alert.alert('Options', 'Choose an action', [
        { text: 'Share', onPress: () => console.log('share') },
        { text: 'Edit', onPress: () => console.log('edit') },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('delete') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={showBasicAlert}>
        <Text style={styles.buttonText}>Basic Alert</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={showConfirmAlert}>
        <Text style={styles.buttonText}>Confirm Alert</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={showActionSheet}>
        <Text style={styles.buttonText}>Action Sheet</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    backgroundColor: '#DE8F05',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
```

**Key Takeaway**: `Alert.alert()` shows native dialogs on both platforms. `ActionSheetIOS` is iOS-only — guard with `Platform.OS === 'ios'` and provide an Android fallback.

**Why It Matters**: Native platform dialogs are important for critical actions like deletion, logout, or destructive operations because users recognize and trust them. A custom-styled modal for "Delete your account?" feels untrustworthy compared to an iOS native `UIAlertController`. The `destructive` button style on iOS applies the red color convention that iOS users understand means irreversible action. This is a rare case where platform-native behavior outweighs cross-platform consistency.

## Group 4: Platform Adaptation

### Example 16: Platform-Specific Code

Write platform-specific code via `Platform.OS` checks, ternary styles, or `.ios.tsx` / `.android.tsx` file extensions.

```typescript
import { View, Text, StyleSheet, Platform } from 'react-native';
// => Platform.OS: 'ios' | 'android' | 'web' | 'windows' | 'macos'

export default function PlatformDemo() {
  return (
    <View style={styles.container}>
      {/* => Conditional rendering per platform */}
      {Platform.OS === 'ios' && (
        <Text style={styles.info}>iOS-specific UI component</Text>
      )}
      {Platform.OS === 'android' && (
        <Text style={styles.info}>Android-specific UI component</Text>
      )}

      {/* => Platform.select: cleaner ternary for multi-platform values */}
      <Text style={styles.info}>
        Platform: {Platform.select({
          ios: 'Apple iOS',
          android: 'Google Android',
          default: 'Other',             // => web, windows, macos
        })}
      </Text>

      {/* => Platform.Version: OS version number */}
      <Text style={styles.info}>
        Version: {Platform.Version}
        {/* => iOS: '17.5' (string), Android: 34 (API level integer) */}
      </Text>

      {/* => Platform.isPad: true on iPad */}
      {Platform.isPad && (
        <Text style={styles.info}>Running on iPad — show two-column layout</Text>
      )}
    </View>
  );
}

// => Platform.select in StyleSheet: apply different values per platform
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    paddingTop: Platform.select({
      ios: 60,          // => extra top padding for iOS status bar area
      android: 40,      // => less needed on Android (status bar handled differently)
      default: 20,
    }),
  },
  info: {
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Platform.select({
      ios: '#e3f2fd',     // => blue tint on iOS
      android: '#e8f5e9', // => green tint on Android
      default: '#fff',
    }),
  },
});

// => File-based platform splitting (alternative to Platform.OS checks):
// Header.ios.tsx    → imported by iOS builds
// Header.android.tsx → imported by Android builds
// import Header from './Header'  → Metro resolves correct file per platform
```

**Key Takeaway**: Use `Platform.OS` checks or `Platform.select()` for inline differences. Use `.ios.tsx` / `.android.tsx` file extensions when platform differences are large enough to warrant separate files.

**Why It Matters**: iOS and Android have fundamentally different design languages — iOS uses SF Symbols, tab bars at the bottom, swipe-back gestures; Android uses Material Design, navigation drawers, and system back buttons. Good React Native apps respect these conventions rather than imposing a lowest-common-denominator design on both platforms. Platform.select in StyleSheet applies at creation time (not render time), so it has zero runtime overhead. File-based splitting keeps complex platform-specific components readable without nested conditionals.

### Example 17: Safe Area — Handling Notches and Home Bars

Physical devices have notches, Dynamic Islands, and home indicators that overlap content. `useSafeAreaInsets` provides the exact inset values to account for them.

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// => react-native-safe-area-context 5.7.0
// => SafeAreaProvider wraps the app (usually in app/_layout.tsx)

function ScreenContent() {
  const insets = useSafeAreaInsets();
  // => insets: { top: number, bottom: number, left: number, right: number }
  // => Example on iPhone 16 Pro: { top: 59, bottom: 34, left: 0, right: 0 }
  // => top: Dynamic Island clearance, bottom: home indicator clearance

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* => paddingBottom ensures content above home indicator */}
      <Text style={styles.topInfo}>
        Safe area top inset: {insets.top}pt
      </Text>
      <Text style={styles.content}>
        This content is always visible — not hidden behind the notch,
        Dynamic Island, or home indicator bar.
      </Text>
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        {/* => bottom bar padding prevents overlap with home indicator */}
        <Text style={styles.bottomBarText}>Bottom Navigation Bar</Text>
      </View>
    </View>
  );
}

export default function SafeAreaDemo() {
  return (
    // => SafeAreaView: all-in-one: applies insets as padding automatically
    // => Use this for simple cases; useSafeAreaInsets for more control
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <ScreenContent />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  topInfo: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#0173B2',
    padding: 16,
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  bottomBarText: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**Key Takeaway**: Always wrap screens with `SafeAreaView` or apply `useSafeAreaInsets` padding to prevent content overlapping notches, Dynamic Islands, and home indicators. Wrap the app root with `SafeAreaProvider`.

**Why It Matters**: Without safe area handling, UI elements appear under the iPhone notch or behind the Android status bar. This is one of the most common quality issues in React Native apps submitted to the App Store — Apple reviewers reject apps where key controls are obscured by hardware UI. Every Expo Router layout template includes safe area handling by default, but understanding `useSafeAreaInsets` lets you apply insets surgically (e.g., only to a fixed bottom bar, not the entire screen padding).

## Group 5: Navigation with Expo Router

### Example 18: File-Based Routing with Expo Router

Expo Router uses the file system to define routes — each file in `app/` becomes a screen. No route configuration needed.

```
app/
├── _layout.tsx          # => root layout: wraps all screens (navigation container)
├── index.tsx            # => maps to '/' route (first screen)
├── profile.tsx          # => maps to '/profile' route
├── settings.tsx         # => maps to '/settings' route
└── (tabs)/              # => route group (no URL segment) for tab layout
    ├── _layout.tsx      # => tab layout definition
    ├── home.tsx         # => '/home' tab
    └── explore.tsx      # => '/explore' tab
```

```typescript
// app/_layout.tsx — root layout
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    // => Stack: stack navigator wrapping all routes
    // => Routes in app/ are automatically registered
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0173B2' },  // => header background
        headerTintColor: '#fff',                        // => header text + back button color
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    />
  );
}
```

```typescript
// app/index.tsx — home screen (maps to '/')
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
// => router: programmatic navigation API

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>

      {/* => router.push: navigate forward (adds to stack) */}
      <Pressable onPress={() => router.push('/profile')}>
        <Text style={styles.link}>Go to Profile</Text>
      </Pressable>

      {/* => router.replace: navigate without adding to stack (no back button) */}
      <Pressable onPress={() => router.replace('/settings')}>
        <Text style={styles.link}>Replace with Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  link: {
    color: '#0173B2',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
```

**Key Takeaway**: Create a file in `app/` and it becomes a navigable route. Use `router.push()` for forward navigation and `router.replace()` for replacing the current screen without back stack entry.

**Why It Matters**: File-based routing eliminates the boilerplate of registering every screen in a central navigation config. This is the same pattern Next.js uses for web — developers familiar with Next.js adapt immediately. Expo Router also provides automatic deep link handling (URL scheme + Universal Links), typed routes (TypeScript catches incorrect route strings), and nested layout support. The file system as single source of truth for routing structure is self-documenting.

### Example 19: Stack Navigation — Headers and Navigation Options

The `Stack` navigator provides iOS-native push/pop transitions with configurable headers.

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* => Stack.Screen: configure individual screen options */}
      <Stack.Screen
        name="index"                    // => matches app/index.tsx
        options={{
          title: 'Home',                // => header title
          headerShown: true,            // => show header (true by default)
        }}
      />
      <Stack.Screen
        name="detail"                   // => matches app/detail.tsx
        options={{
          title: 'Detail',
          headerBackTitle: 'Back',      // => iOS back button text (default: previous title)
          presentation: 'modal',        // => slides up as modal sheet (iOS style)
          // => 'card' (default, push), 'modal' (slide up), 'transparentModal'
        }}
      />
    </Stack>
  );
}
```

```typescript
// app/detail.tsx — using router for navigation
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

export default function DetailScreen() {
  const navigation = useNavigation();  // => access React Navigation's nav object

  useLayoutEffect(() => {
    // => useLayoutEffect: runs before paint (prevents header flicker)
    navigation.setOptions({
      title: 'Dynamic Title',           // => override title after data loads
      headerRight: () => (
        // => custom button in header right area
        <Pressable onPress={() => console.log('header action')}>
          <Text style={{ color: '#0173B2' }}>Action</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detail Screen</Text>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        {/* => router.back(): go back to previous screen (pop from stack) */}
        <Text style={styles.backText}>Go Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#0173B2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backText: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**Key Takeaway**: Configure stack screen options in `_layout.tsx` via `Stack.Screen` or dynamically via `useNavigation().setOptions()` with `useLayoutEffect`. Use `router.back()` to pop the stack programmatically.

**Why It Matters**: Stack navigation is the foundational navigation pattern for iOS applications and is widely used on Android. The hardware back button on Android and swipe-back gesture on iOS both integrate automatically with the stack. `presentation: 'modal'` creates iOS-native modal sheets — the standard pattern for forms, pickers, and temporary detail views. Dynamic header configuration via `useLayoutEffect` is important when the header title or actions depend on async data loaded by the screen.

### Example 20: Tab Navigation with Expo Router

The `Tabs` navigator creates a tab bar at the bottom of the screen — the standard navigation pattern for top-level sections.

```typescript
// app/(tabs)/_layout.tsx — tab layout
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0173B2',       // => active tab icon + label color
        tabBarInactiveTintColor: '#999',         // => inactive tab color
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
        headerShown: false,                      // => hide individual screen headers (use shared)
      }}
    >
      <Tabs.Screen
        name="home"                              // => matches app/(tabs)/home.tsx
        options={{
          title: 'Home',                         // => tab label
          tabBarIcon: ({ color, size }) => (
            // => tabBarIcon render function receives active color + size
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" color={color} size={size} />
          ),
          tabBarBadge: 3,                        // => notification badge (number or string)
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```

```typescript
// app/(tabs)/home.tsx — home tab screen
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function HomeTab() {
  useFocusEffect(
    useCallback(() => {
      // => runs when tab becomes focused (user taps to this tab)
      console.log('Home tab focused — refresh data here');
      return () => {
        // => cleanup: runs when tab loses focus
        console.log('Home tab blurred');
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Tab</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
});
```

**Key Takeaway**: Create `app/(tabs)/_layout.tsx` with `<Tabs>` and add `Tabs.Screen` entries for each tab. Wrap the folder name in parentheses to create a route group (no URL segment). Use `useFocusEffect` to refresh data when a tab is selected.

**Why It Matters**: Tab navigation is the primary top-level navigation pattern in iOS (used in App Store, Instagram, Twitter) and common on Android. Expo Router's Tabs component renders native-feeling tab bars using `UITabBarController` patterns on iOS. `useFocusEffect` enables per-tab data refresh on every visit — critical for list tabs that need fresh data without a full remount. The route group `(tabs)` folder keeps tab screens organized in the file system without polluting the URL space.

### Example 21: Dynamic Routes — Parameterized URLs

Dynamic route segments (file names with `[param]`) capture URL parameters for detail screens.

```typescript
// app/user/[id].tsx — dynamic segment captures 'id'
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

type UserParams = {
  id: string;                    // => route param from [id] segment
  tab?: string;                  // => optional query param
};

export default function UserScreen() {
  const params = useLocalSearchParams<UserParams>();
  // => useLocalSearchParams: reads params for THIS screen only (not parent layouts)
  // => For params shared across layouts, use useGlobalSearchParams

  const { id, tab } = params;
  // => id: '42' (string, always string from URL)
  // => tab: 'posts' | undefined

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.info}>User ID: {id}</Text>
      <Text style={styles.info}>Active Tab: {tab ?? 'none'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    fontSize: 16,
    color: '#555',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
});
```

```typescript
// Navigate to dynamic route with params
import { router } from "expo-router";

// => Push to /user/42
router.push("/user/42");

// => Push with query params: /user/42?tab=posts
router.push({ pathname: "/user/[id]", params: { id: "42", tab: "posts" } });
// => Expo Router typed routes: TypeScript validates '/user/[id]' exists

// => Catch-all: app/[...path].tsx captures /a/b/c as { path: ['a', 'b', 'c'] }
// => Optional catch-all: app/[[...path]].tsx also matches '/' (no segments)
```

**Key Takeaway**: Name files `[param].tsx` for dynamic segments. Read params with `useLocalSearchParams<T>()`. Navigate with typed params using `{ pathname, params }` object.

**Why It Matters**: Dynamic routes enable detail screens (user profiles, product pages, post threads) without pre-registering every possible ID as a static route. Expo Router's typed routes validate route strings at compile time — navigating to `'/user/[id]'` with a typo like `'/users/[id]'` is a TypeScript error, not a silent runtime failure. `useLocalSearchParams` scoping prevents param conflicts when parent and child layouts both read route params.

### Example 22: Passing Data Between Screens

Route params in Expo Router pass simple values. For complex objects, use global state (Zustand) or a query cache (TanStack Query).

```typescript
// Passing params forward
import { router } from "expo-router";

type OrderParams = {
  orderId: string;
  productName: string;
  total: string; // => numbers must be strings in URL params
};

// => Push to /order-detail with params
router.push({
  pathname: "/order-detail",
  params: {
    orderId: "ORD-2026-001",
    productName: "Laptop Pro",
    total: "1299.99", // => convert number to string for params
  } satisfies OrderParams,
});
```

```typescript
// app/order-detail.tsx — reading params
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

type OrderParams = {
  orderId: string;
  productName: string;
  total: string;
};

export default function OrderDetail() {
  const params = useLocalSearchParams<OrderParams>();
  // => params: { orderId: 'ORD-2026-001', productName: 'Laptop Pro', total: '1299.99' }

  const total = parseFloat(params.total);
  // => convert back from string to number

  return (
    <>
      {/* => Stack.Screen inside screen: override header from within the screen */}
      <Stack.Screen options={{ title: `Order ${params.orderId}` }} />

      <View style={styles.container}>
        <Text style={styles.label}>Order ID</Text>
        <Text style={styles.value}>{params.orderId}</Text>

        <Text style={styles.label}>Product</Text>
        <Text style={styles.value}>{params.productName}</Text>

        <Text style={styles.label}>Total</Text>
        <Text style={styles.value}>${total.toFixed(2)}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#999',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: -8,
  },
});
```

**Key Takeaway**: Route params are always strings — convert numbers/booleans before passing and parse them in the receiving screen. Use global state (Zustand/TanStack Query) for complex objects that don't serialize cleanly to URL strings.

**Why It Matters**: URL params are limited to primitive string values — passing complex objects requires JSON serialization, which makes URLs opaque and breaks deep linking readability. The pattern of using route params for IDs and fetching full data in the receiving screen is more robust: the detail screen can independently refetch the data, handles cache invalidation properly, and doesn't break when the OS reclaims the originating screen's memory. This aligns with how web deep links work, enabling Universal Links and App Links to open screens directly.

## Group 6: React Hooks in Mobile Context

### Example 23: useState and useEffect — Mobile Lifecycle

React hooks work identically in React Native. `useEffect` cleanup handles subscriptions and listeners that must be unregistered when a component unmounts or the effect re-runs.

```typescript
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, AppState, AppStateStatus } from 'react-native';

export default function LifecycleDemo() {
  const [count, setCount] = useState(0);
  // => count: number, starts at 0
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  // => AppState.currentState: 'active' | 'background' | 'inactive'

  useEffect(() => {
    // => AppState listener: fires when app goes to background or returns
    const subscription = AppState.addEventListener('change', (nextState) => {
      // => nextState: 'active' (foreground) | 'background' | 'inactive' (iOS only)
      setAppState(nextState);
      if (nextState === 'active') {
        console.log('App foregrounded — refresh stale data');
      }
    });

    // => cleanup: remove listener when component unmounts
    return () => subscription.remove();
    // => CRITICAL: without cleanup, listener persists after component unmount → memory leak
  }, []);
  // => empty dependency array: effect runs once on mount, cleanup on unmount

  useEffect(() => {
    if (count > 0 && count % 5 === 0) {
      console.log(`Milestone: ${count} presses!`);
      // => fires every time count is a multiple of 5
    }
  }, [count]);
  // => dependency [count]: re-runs whenever count changes

  const increment = useCallback(() => {
    setCount(c => c + 1);
    // => functional update: uses current value, avoids stale closure
  }, []);
  // => useCallback: stable function reference (no re-creation on each render)

  return (
    <View style={styles.container}>
      <Text style={styles.stateInfo}>App State: {appState}</Text>
      <Text style={styles.count}>{count}</Text>
      <Pressable style={styles.button} onPress={increment}>
        <Text style={styles.buttonText}>Increment</Text>
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
  stateInfo: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  count: {
    fontSize: 72,
    fontWeight: '300',
    color: '#0173B2',
  },
  button: {
    backgroundColor: '#0173B2',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Key Takeaway**: Always return cleanup functions from `useEffect` when subscribing to events, timers, or native listeners. Mobile apps can be backgrounded and foregrounded — `AppState` lets you respond to these transitions.

**Why It Matters**: Memory leaks in mobile apps manifest as increasing RAM usage that accumulates over time, eventually causing the OS to kill the app. Every `addEventListener` without a corresponding `removeEventListener` is a leak. React Native's `AppState` API is essential for refreshing stale data after the user returns from background (e.g., after authenticating in Safari and returning to the app). The functional update pattern (`setCount(c => c + 1)`) is critical for async contexts where the previous state value may have changed between the closure's creation and execution.

## Group 7: Local Persistence

### Example 24: AsyncStorage — Simple Key-Value Persistence

`AsyncStorage` provides async, persistent key-value storage. It survives app restarts but is cleared on uninstall.

```typescript
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// => @react-native-async-storage/async-storage
// => NOT the removed built-in AsyncStorage from react-native

const STORAGE_KEY = '@myapp:user_preferences';
// => prefix with @appname: to namespace keys and avoid collisions

type Preferences = {
  username: string;
  theme: 'light' | 'dark';
};

export default function AsyncStorageDemo() {
  const [username, setUsername] = useState('');
  const [saved, setSaved] = useState<Preferences | null>(null);

  useEffect(() => {
    // => load saved preferences on mount
    const loadPreferences = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        // => getItem: returns string | null (null if key doesn't exist)
        if (json) {
          const prefs = JSON.parse(json) as Preferences;
          // => AsyncStorage stores strings only — JSON for complex data
          setSaved(prefs);
          setUsername(prefs.username);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const savePreferences = async () => {
    try {
      const prefs: Preferences = { username, theme: 'light' };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      // => setItem: stores string (serialize objects to JSON)
      setSaved(prefs);
      console.log('Saved!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const clearPreferences = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    // => removeItem: deletes key entirely
    setSaved(null);
    setUsername('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
        placeholderTextColor="#999"
      />
      <Pressable style={styles.saveButton} onPress={savePreferences}>
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>
      <Pressable style={styles.clearButton} onPress={clearPreferences}>
        <Text style={styles.buttonText}>Clear</Text>
      </Pressable>
      {saved && (
        <Text style={styles.savedInfo}>
          Saved: {saved.username} ({saved.theme} theme)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#029E73',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#CA9161',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  savedInfo: {
    color: '#555',
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
});
```

**Key Takeaway**: `AsyncStorage` stores only strings — serialize objects with `JSON.stringify`/`JSON.parse`. Always handle errors since storage I/O can fail. For synchronous, high-performance storage, use MMKV (Example 41).

**Why It Matters**: AsyncStorage is the baseline persistence solution — simple to use, no setup, works across platforms. Its async nature means you cannot read stored values synchronously during render, requiring `useEffect` + state pattern. Performance limitations (reads are ~3-5ms, writes ~10-20ms) make AsyncStorage unsuitable for high-frequency operations like storing draft text on every keystroke. MMKV (Example 41) solves this with synchronous reads at ~30x AsyncStorage speed using a Nitro Module.

## Group 8: Expo APIs

### Example 25: expo-font — Loading Custom Fonts

`expo-font` loads custom font files and provides a hook to await their availability before rendering.

```typescript
import { useFonts } from 'expo-font';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function FontDemo() {
  const [fontsLoaded, fontError] = useFonts({
    // => key: font family name used in styles
    // => value: require path to .otf or .ttf file in assets/fonts/
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Italic': require('../assets/fonts/Poppins-Italic.ttf'),
  });
  // => fontsLoaded: true when all fonts are decoded and available
  // => fontError: Error | null if any font failed to load

  if (fontError) {
    // => font load failure: fall through to system font rather than crash
    console.warn('Font load error:', fontError);
  }

  if (!fontsLoaded) {
    // => show spinner while fonts decode (usually <500ms)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0173B2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.regular}>
        Poppins Regular — the font name matches the key in useFonts()
      </Text>
      <Text style={styles.bold}>
        Poppins Bold — different weight requires a separate file + key
      </Text>
      <Text style={styles.italic}>
        Poppins Italic — each variant (weight, style) needs its own .ttf
      </Text>
      <Text style={styles.system}>
        System font — fontFamily omitted, uses iOS San Francisco / Android Roboto
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  regular: {
    fontFamily: 'Poppins-Regular',  // => must match key in useFonts()
    fontSize: 16,
    lineHeight: 24,
  },
  bold: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    lineHeight: 24,
  },
  italic: {
    fontFamily: 'Poppins-Italic',
    fontSize: 16,
    lineHeight: 24,
  },
  system: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
});
```

**Key Takeaway**: Call `useFonts()` at the app root with `{ 'FontName-Weight': require('./path') }`. Gate rendering behind `fontsLoaded` check to prevent FOUT (Flash of Unstyled Text) with missing font families.

**Why It Matters**: Rendering before fonts load causes a flash where text appears in the system font briefly before switching to the custom font. On iOS this manifests as a layout shift that users notice. Expo Router's default template uses `SplashScreen.preventAutoHideAsync()` + `SplashScreen.hideAsync()` after fonts load to prevent any visible flash. Each font weight and style variant is a separate `.ttf` file — `fontWeight: 'bold'` in styles only works if the bold variant is loaded under its own key; otherwise the OS simulates bold through letter thickening which looks poor.

### Example 26: expo-image — Optimized Image with Caching

`expo-image` replaces React Native's built-in `Image` with better caching, blurhash placeholders, and progressive loading.

```typescript
import { View, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
// => expo-image replaces RN's built-in Image for production use

export default function ExpoImageDemo() {
  const BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
  // => blurhash: compact string encoding of image colors for placeholder
  // => generate at https://blurha.sh/ or server-side

  return (
    <View style={styles.container}>
      {/* => Basic usage: identical to RN Image but with smarter caching */}
      <Image
        source="https://picsum.photos/400/200"   // => string URI (no wrapper object needed)
        style={styles.image}
        contentFit="cover"                        // => replaces resizeMode (same behavior)
        // => 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
        transition={300}                          // => 300ms crossfade from placeholder to image
      />

      {/* => With blurhash placeholder: shows while downloading */}
      <Image
        source="https://picsum.photos/400/201"
        style={styles.image}
        placeholder={{ blurhash: BLURHASH }}      // => blurred preview during load
        contentFit="cover"
        transition={500}                          // => 500ms fade from blurhash to image
        cachePolicy="memory-disk"                 // => cache in memory + disk (default)
        // => 'none' | 'disk' | 'memory' | 'memory-disk'
        recyclingKey="photo-2"                    // => reuse image slot in lists (prevents flicker)
      />

      {/* => Priority loading */}
      <Image
        source="https://picsum.photos/400/202"
        style={styles.image}
        contentFit="contain"
        priority="high"                           // => 'low' | 'normal' | 'high'
        // => high priority: starts downloading before parent renders (prefetch)
      />

      <Text style={styles.note}>
        expo-image caches automatically — second load is instantaneous
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0', // => fallback while loading
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
```

**Key Takeaway**: Use `expo-image` instead of React Native's built-in `Image` in production. It provides disk+memory caching, blurhash placeholders, progressive fade transitions, and recycling keys for list performance.

**Why It Matters**: React Native's built-in Image component lacks disk caching — every cold app launch re-downloads remote images. `expo-image` implements a shared LRU disk cache (default 200MB) that survives across app sessions. Blurhash placeholders show a pixel-approximate preview of the image while it downloads, eliminating jarring white boxes. The `recyclingKey` prop is critical for lists — without it, expo-image unmounts and remounts the image view on every list scroll, causing flickering and re-downloads. This single change typically cuts visible image loading time by 80-95% in production apps.

### Example 27: Icons with @expo/vector-icons

`@expo/vector-icons` bundles popular icon sets (Ionicons, MaterialIcons, FontAwesome) with zero configuration in Expo projects.

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';
// => @expo/vector-icons: pre-bundled icon sets, no font loading needed

export default function IconsDemo() {
  return (
    <View style={styles.container}>
      {/* => Ionicons: iOS-style + MD icons, best for Expo apps */}
      <View style={styles.row}>
        <Ionicons name="home" size={24} color="#0173B2" />
        {/* => name: string icon name, size: number, color: string */}
        <Ionicons name="settings-outline" size={24} color="#0173B2" />
        {/* => '-outline' suffix: outlined variant (Ionicons specific) */}
        <Ionicons name="heart" size={24} color="#CC78BC" />
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </View>

      {/* => MaterialIcons: Google Material Design icons */}
      <View style={styles.row}>
        <MaterialIcons name="add" size={28} color="#029E73" />
        <MaterialIcons name="delete" size={28} color="#DE8F05" />
        <MaterialIcons name="share" size={28} color="#0173B2" />
        <MaterialIcons name="more-vert" size={28} color="#999" />
      </View>

      {/* => Feather: minimal outline icons */}
      <View style={styles.row}>
        <Feather name="camera" size={22} color="#0173B2" />
        <Feather name="search" size={22} color="#0173B2" />
        <Feather name="bell" size={22} color="#0173B2" />
        <Feather name="user" size={22} color="#0173B2" />
      </View>

      {/* => Icon inside a Pressable (common pattern for icon buttons) */}
      <View style={styles.row}>
        {['home', 'search', 'heart', 'person'].map((name) => (
          <View key={name} style={styles.iconButton}>
            {/* => View wrapping for tap area + styling */}
            <Ionicons
              name={name as any}                 // => cast for dynamic name
              size={24}
              color="#fff"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 24,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: '#0173B2',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

**Key Takeaway**: Import named icon sets from `@expo/vector-icons`. Each icon takes `name`, `size`, and `color` props. Wrap in `Pressable` or `View` for interactive icon buttons.

**Why It Matters**: Vector icons scale without blurriness on all screen densities (1x through 3x) unlike PNG assets that require `@2x` and `@3x` variants. `@expo/vector-icons` bundles 30,000+ icons from the most popular icon libraries, pre-loaded as font files so they are available immediately without async loading. Ionicons is the recommended choice for Expo apps as it provides both iOS-style and Android Material variants for the same concept (e.g., `heart` vs `heart-outline`), enabling platform-appropriate icon selection with minimal code.

### Example 28: Push Notifications Setup with expo-notifications

Setting up push notifications requires requesting permission, getting an Expo push token, and registering handlers for foreground and background notifications.

```typescript
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
// => expo-notifications: permission + token + handler API
// => expo-device: check if physical device (push requires real device, not simulator)

// => Set global notification handler (call this at app root, before any component)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // => show banner when app is in foreground
    shouldPlaySound: true,    // => play sound for foreground notifications
    shouldSetBadge: false,    // => don't update app badge count
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    // => Push notifications require a physical device
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  // => check existing permission status before requesting
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    // => shows OS permission dialog (iOS requires this explicitly)
    // => Android 13+ also requires this (POST_NOTIFICATIONS permission)
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id',
    // => find in app.json expo.extra.eas.projectId or EAS dashboard
  });
  // => returns { type: 'expo', data: 'ExponentPushToken[xxx]' }

  if (Platform.OS === 'android') {
    // => Android: configure notification channel (required for Android 8+)
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      // => MAX: heads-up notification (pops over other apps)
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0173B2',
    });
  }

  return tokenData.data;  // => 'ExponentPushToken[xxxxxxxxxxxxxx]'
}

export default function PushNotificationSetup() {
  const [token, setToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotifications().then(setToken);

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // => fires when notification arrives while app is in FOREGROUND
      console.log('Notification received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // => fires when user TAPS notification (any app state: fg, bg, killed)
      console.log('User tapped notification:', response.notification.request.content.data);
    });

    return () => {
      // => cleanup subscriptions on unmount
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notifications</Text>
      <Text style={styles.tokenLabel}>Expo Push Token:</Text>
      <Text style={styles.token} numberOfLines={2}>
        {token ?? 'Requesting permission...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  tokenLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  token: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    color: '#333',
  },
});
```

**Key Takeaway**: Register for push notifications in a `useEffect` on the root screen. Always check if running on a physical device, request permission, get the Expo push token, and configure Android notification channels. Clean up listeners on unmount.

**Why It Matters**: Push notifications are one of the highest-impact engagement features in mobile apps — re-engagement rates are 3-5x higher than email for time-sensitive content. The Expo push token is sent to your backend server, which uses the Expo Push API to send notifications without managing APNs (Apple) or FCM (Google) credentials directly. Android 13+ added runtime permission requirements matching iOS, so permission requests are now mandatory on both platforms. The response listener handling is critical for deep linking users directly into relevant content when they tap a notification.
