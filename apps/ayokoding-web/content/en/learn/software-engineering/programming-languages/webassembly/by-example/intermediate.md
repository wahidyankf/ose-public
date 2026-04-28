---
title: "Intermediate"
date: 2026-04-29T00:00:00+07:00
draft: false
weight: 10000002
description: "Examples 29-57: Rust toolchain, Emscripten, performance patterns, WASI, and debugging (40-75% coverage)"
tags: ["webassembly", "wasm", "rust", "emscripten", "wasi", "wasm-bindgen", "by-example", "intermediate"]
---

## Intermediate Level: Rust Toolchain, Emscripten, Performance, and WASI

Examples 29-57 cover the dominant production toolchains for WebAssembly: Rust with `wasm-pack` and `wasm-bindgen`, C/C++ with Emscripten, performance optimization patterns, WASI for server-side Wasm, and DWARF debugging. By example 57, you can build, optimize, debug, and deploy production Wasm modules from multiple source languages.

---

## Example 29: Rust Wasm Project Setup with wasm-pack

`wasm-pack` is the primary tool for building Rust WebAssembly packages. It wraps `cargo build`, runs `wasm-bindgen`, and produces npm-compatible packages. The Rust crate must be a library (`lib`) with `crate-type = ["cdylib"]` — a C-compatible dynamic library that Wasm runtimes can load.

**CRITICAL**: The `wasm-bindgen` crate version in `Cargo.toml` MUST exactly match the installed `wasm-bindgen-cli` version. Version mismatch causes cryptic panics like `import object field '_wbindgen_placeholder_' is not a Function`.

```bash
# Install wasm-pack (includes wasm-bindgen-cli internally)
cargo install wasm-pack              # => installs wasm-pack 0.14.0

# Create a new Wasm library project
wasm-pack new wasm-greet             # => scaffolds project structure
# => creates wasm-greet/
# =>   src/lib.rs         — Rust source with example code
# =>   Cargo.toml         — with wasm-bindgen dependency
# =>   tests/web.rs       — browser integration tests

cd wasm-greet
```

```toml
# Cargo.toml — required configuration for Wasm library
[package]
name = "wasm-greet"
version = "0.1.0"
edition = "2021"

[lib]
# cdylib: C-compatible dynamic library (required for Wasm loading)
# rlib: Rust library (optional, for use by other Rust crates)
crate-type = ["cdylib", "rlib"]

[dependencies]
# CRITICAL: version must exactly match wasm-bindgen-cli version
wasm-bindgen = "0.2.120"   # => provides #[wasm_bindgen] attribute macro

[dev-dependencies]
wasm-bindgen-test = "0.3"  # => browser-based testing framework
```

```bash
# Build for browser target (ESM module output)
wasm-pack build --target web         # => produces pkg/ directory:
                                      # => pkg/wasm_greet_bg.wasm    — binary
                                      # => pkg/wasm_greet.js         — JS bindings
                                      # => pkg/wasm_greet.d.ts       — TypeScript types
                                      # => pkg/package.json          — npm package manifest

# Build for bundler (Webpack/Vite/esbuild): uses import statements
wasm-pack build --target bundler     # => adds "type": "module" to package.json

# Build for Node.js (CommonJS): uses require()
wasm-pack build --target nodejs      # => CommonJS output with require()
```

**Key Takeaway**: `wasm-pack new` scaffolds a Rust Wasm library; `Cargo.toml` requires `crate-type = ["cdylib"]` and wasm-bindgen as a dependency. The wasm-bindgen crate version MUST exactly match the CLI version.

**Why It Matters**: The wasm-pack ecosystem abstracts away the multi-step compilation pipeline: Rust → Wasm binary → wasm-bindgen post-processing → npm package. Getting the version pinning right prevents a frustrating class of errors where the Wasm binary was compiled against a different bindgen ABI than the generated JS glue expects. Version lock files (`Cargo.lock`) are essential — always commit them for application crates to prevent surprise version mismatches in CI.

---

## Example 30: `#[wasm_bindgen]` on Functions

The `#[wasm_bindgen]` attribute macro marks Rust items for export to JavaScript. Applied to `fn`, it generates both the Wasm export and the JavaScript wrapper function. The generated JS wrapper handles type conversion between JS and Wasm.

```rust
// src/lib.rs — #[wasm_bindgen] on functions
use wasm_bindgen::prelude::*;   // => import wasm_bindgen macros and types

// Export a simple function: JS calls add(3, 4), gets back 7
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b     // => i32 addition; maps directly to Wasm i32.add
               // => no wrappers needed: i32 is a Wasm native type
}

// Export a function with a renamed JS name
#[wasm_bindgen(js_name = "greet")]  // => exported as "greet" not "hello_world"
pub fn hello_world() -> String {
    "Hello from Rust!".to_string()  // => String needs copying across boundary
                                     // => wasm-bindgen handles ptr+len allocation
}

// Export a function that can panic (panic hook converts to JS Error)
#[wasm_bindgen]
pub fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        panic!("division by zero");  // => with console_error_panic_hook: logs to console
                                      // => without: cryptic "unreachable executed" error
    }
    a / b
}

// Initialize the panic hook (call this once at startup)
#[wasm_bindgen(start)]             // => runs this function when module instantiates
pub fn init() {
    console_error_panic_hook::set_once(); // => converts Rust panics to JS console.error
}
```

```javascript
// usage.js — calling wasm-bindgen exported functions
import init, { add, greet, divide } from "./pkg/wasm_greet.js";

await init(); // => fetches and instantiates the .wasm binary

console.log(add(3, 4)); // => 7
console.log(greet()); // => "Hello from Rust!"

try {
  divide(10, 0); // => triggers Rust panic
} catch (e) {
  console.error(e.message); // => "panicked at 'division by zero', src/lib.rs:15:9"
}
```

**Key Takeaway**: `#[wasm_bindgen]` marks Rust functions for JS export. Native Wasm types (`i32`, `f64`) pass without wrappers; `String` and complex types are handled via generated copy/allocation code. The `#[wasm_bindgen(start)]` attribute marks an initialization function.

**Why It Matters**: The panic hook initialization (`console_error_panic_hook`) is the difference between debugging "RuntimeError: unreachable executed" (useless) and seeing the actual Rust panic message with file and line number (actionable). Every Wasm project using Rust should call `console_error_panic_hook::set_once()` in its initialization path. Forgetting it is one of the most common reasons Rust Wasm debugging is painful.

---

## Example 31: Passing Strings Across the Wasm–JS Boundary

`String` and `&str` require special handling across the Wasm–JS boundary because Wasm has no native string type. `wasm-bindgen` 0.2.120 generates code that allocates a UTF-8 buffer in Wasm memory, copies the string, and passes pointer+length to JS (for JS-to-Rust) or allocates in Wasm, writes bytes, and returns the pointer (for Rust-to-JS).

```rust
// src/lib.rs — string passing with wasm-bindgen 0.2.120
use wasm_bindgen::prelude::*;

// Rust → JS: returning a String allocates on Wasm heap, copies to JS string
#[wasm_bindgen]
pub fn make_greeting(name: &str) -> String {  // => &str: borrowed from JS
    format!("Hello, {}! From Rust.", name)    // => format! creates new String
                                               // => wasm-bindgen: alloc in Wasm, copy to JS, free
}

// JS → Rust: accepting &str borrows JS string's UTF-8 encoding
#[wasm_bindgen]
pub fn count_chars(s: &str) -> usize {
    s.chars().count()   // => counts Unicode scalar values (not bytes)
                         // => "café" → 4 (4 chars) but 5 bytes in UTF-8
}

// Accepting String: moves ownership into Rust
#[wasm_bindgen]
pub fn to_uppercase(s: String) -> String {
    s.to_uppercase()    // => consumes s, returns new String
                         // => UTF-8 aware: handles non-ASCII correctly
}

// Returning Option<String>: None becomes null/undefined in JS
#[wasm_bindgen]
pub fn parse_int(s: &str) -> Option<i32> {
    s.parse::<i32>().ok()  // => Ok(n) → Some(n) → n in JS
                             // => Err(_) → None → undefined in JS
}
```

```javascript
// string-usage.js
import init, { make_greeting, count_chars, to_uppercase, parse_int } from "./pkg/wasm_greet.js";
await init();

console.log(make_greeting("World")); // => "Hello, World! From Rust."
console.log(count_chars("café")); // => 4 (Unicode chars, not bytes)
console.log(to_uppercase("hello")); // => "HELLO"
console.log(parse_int("42")); // => 42
console.log(parse_int("not-a-number")); // => undefined (None → undefined)
```

**Key Takeaway**: `&str` parameters receive a UTF-8 copy from JS; `String` return values copy Wasm heap bytes to a JS string. `Option<String>` maps to `string | undefined` in JS. wasm-bindgen generates all allocation and copy code automatically.

**Why It Matters**: String passing is the most common performance concern in Wasm–JS boundaries. Each `&str` parameter involves: JS TextEncoder encodes the string, allocates space in Wasm heap, copies bytes, then Rust function runs, then heap is freed. For hot paths called thousands of times per frame (like a text search function), this allocation overhead dominates. The optimization is to pre-allocate a large buffer, copy the string once, and pass ptr+len directly — which is what wasm-bindgen's `unsafe` code helpers support.

---

## Example 32: Passing Vec<u8> and &[u8] Slices

Binary data (images, audio, file contents) is passed as byte slices. `wasm-bindgen` 0.2.120 provides `js_sys::Uint8Array` for zero-copy access to JS typed arrays from Rust, and `&[u8]` / `Vec<u8>` for owned copy semantics.

```rust
// src/lib.rs — byte slice passing
use wasm_bindgen::prelude::*;
use js_sys::Uint8Array;

// Accept &[u8]: wasm-bindgen copies JS Uint8Array into Wasm memory
#[wasm_bindgen]
pub fn sum_bytes(data: &[u8]) -> u32 {
    data.iter().map(|&b| b as u32).sum()  // => sum all bytes as u32
                                            // => data is a Rust slice into Wasm memory
}

// Return Vec<u8>: wasm-bindgen copies Wasm bytes to a new JS Uint8Array
#[wasm_bindgen]
pub fn reverse_bytes(data: &[u8]) -> Vec<u8> {
    let mut result = data.to_vec();  // => copy: &[u8] → Vec<u8>
    result.reverse();                // => reverse in place
    result                           // => wasm-bindgen: alloc JS Uint8Array, copy bytes
}

// Zero-copy with js_sys::Uint8Array: operate on JS memory directly
#[wasm_bindgen]
pub fn invert_colors(input: &Uint8Array, output: &Uint8Array) {
    // Zero-copy read from JS typed array (unsafe: borrows JS memory)
    let len = input.length() as usize;  // => byte length of input
    for i in 0..len {
        // Invert each byte (255 - byte inverts the color channel)
        output.set_index(i as u32, 255 - input.get_index(i as u32));
    }
    // => No heap allocation needed — operates directly on JS Uint8Array memory
}
```

```javascript
// byte-slice-usage.js
import init, { sum_bytes, reverse_bytes, invert_colors } from "./pkg/wasm_greet.js";
await init();

const data = new Uint8Array([10, 20, 30, 40, 50]);

console.log(sum_bytes(data)); // => 150
console.log(reverse_bytes(data)); // => Uint8Array [50, 40, 30, 20, 10]

// Zero-copy color inversion
const pixels = new Uint8Array([255, 128, 0, 255]); // => RGBA: opaque orange
const inverted = new Uint8Array(4);
invert_colors(pixels, inverted);
console.log([...inverted]); // => [0, 127, 255, 0] — inverted channels
```

**Key Takeaway**: `&[u8]` parameters and `Vec<u8>` returns involve copying between JS and Wasm heap. `js_sys::Uint8Array` with `get_index`/`set_index` enables zero-copy operations directly on JS-owned typed arrays.

**Why It Matters**: Image processing, audio encoding, and cryptography functions work on megabytes of byte data. The difference between copying 4 MB on every call versus zero-copy is the difference between a smooth user experience and a stuttering one. The `js_sys::Uint8Array` zero-copy pattern is how Photoshop Web's Wasm image pipeline avoids doubling memory usage — it operates on the same `ArrayBuffer` that the browser's canvas API reads from.

---

## Example 33: Exporting Rust Structs as JavaScript Classes

`#[wasm_bindgen]` on a `struct` and its `impl` block generates a JavaScript class. The struct instance lives in Wasm memory; JS holds a handle (an index into a table of live objects). Methods appear as class methods in JS.

```rust
// src/lib.rs — exporting a Rust struct as a JS class
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Counter {
    value: i32,    // => private field (no wasm_bindgen on field)
    step: i32,     // => increment step
}

#[wasm_bindgen]
impl Counter {
    // Constructor: JS calls `new Counter(step)`
    #[wasm_bindgen(constructor)]
    pub fn new(step: i32) -> Counter {
        Counter { value: 0, step }  // => creates Counter on Wasm heap
    }

    // Instance method: JS calls `counter.increment()`
    pub fn increment(&mut self) {
        self.value += self.step;    // => mutates Wasm-side state
    }

    // Getter: JS calls `counter.value` (not counter.value())
    #[wasm_bindgen(getter)]
    pub fn value(&self) -> i32 {
        self.value  // => reads Wasm-side field
    }

    // Static method: JS calls `Counter.reset()`
    pub fn reset_all() {
        // => static method: no `self`, no instance needed
        web_sys::console::log_1(&"All counters conceptually reset".into());
    }
}

// Drop is automatic: when JS GC collects the handle, Wasm memory is freed
// (in wasm-bindgen 0.2.x, explicit .free() is available for deterministic drop)
```

```javascript
// class-usage.js
import init, { Counter } from "./pkg/wasm_greet.js";
await init();

const counter = new Counter(5); // => calls Counter::new(5)
// => counter.value is 0
console.log(counter.value); // => 0 (getter property)

counter.increment(); // => counter.value is now 5
counter.increment(); // => counter.value is now 10
console.log(counter.value); // => 10

Counter.reset_all(); // => static method call
counter.free(); // => explicit drop (optional; GC also collects)
```

**Key Takeaway**: `#[wasm_bindgen]` on a struct + impl generates a JS class where the object lives in Wasm memory. Getters/setters use `#[wasm_bindgen(getter)]`/`#[wasm_bindgen(setter)]`; the constructor uses `#[wasm_bindgen(constructor)]`.

**Why It Matters**: Struct exports are how production Rust Wasm APIs are designed. Instead of a flat API of free functions with manual state management (bug-prone), you get an ergonomic JS class that feels native to JS consumers. The `counter.free()` pattern is important for long-lived applications where many instances are created and discarded — without explicit `free()`, wasm-bindgen's object table can grow unbounded in Wasm heap until the next GC cycle frees unreachable handles.

---

## Example 34: Calling Browser Web APIs from Rust Using web-sys

`web-sys` is a crate providing Rust bindings to all Web APIs (DOM, Canvas, WebGL, Fetch, etc.), auto-generated from the WebIDL specifications. Enable specific APIs in `Cargo.toml` under `[features]` to avoid bloating the binary with unused bindings.

```toml
# Cargo.toml — enabling web-sys features
[dependencies]
wasm-bindgen = "0.2.120"
web-sys = { version = "0.3", features = [
  "Window",         # => window.document, window.location, etc.
  "Document",       # => document.getElementById, document.createElement, etc.
  "HtmlCanvasElement", # => canvas.getContext("2d")
  "CanvasRenderingContext2d", # => ctx.fillRect, ctx.drawImage, etc.
  "console",        # => console.log from Rust
]}
```

```rust
// src/lib.rs — using web-sys to call browser APIs from Rust
use wasm_bindgen::prelude::*;
use web_sys::{window, HtmlCanvasElement, CanvasRenderingContext2d};

#[wasm_bindgen]
pub fn draw_rect(canvas_id: &str, x: f64, y: f64, w: f64, h: f64, color: &str) {
    let document = window()             // => web_sys::window() → Option<Window>
        .unwrap()                       // => panics if not in browser context
        .document()                     // => → Option<Document>
        .unwrap();

    let canvas = document
        .get_element_by_id(canvas_id)  // => → Option<Element>
        .unwrap()
        .dyn_into::<HtmlCanvasElement>() // => cast Element to HtmlCanvasElement
        .map_err(|_| "canvas not found")
        .unwrap();

    let ctx = canvas
        .get_context("2d")             // => → Result<Option<Object>, JsValue>
        .unwrap()
        .unwrap()
        .dyn_into::<CanvasRenderingContext2d>() // => cast to canvas 2D context
        .unwrap();

    ctx.set_fill_style(&color.into()); // => ctx.fillStyle = color
    ctx.fill_rect(x, y, w, h);        // => ctx.fillRect(x, y, w, h)
}

// Log to browser console from Rust
#[wasm_bindgen]
pub fn log_message(msg: &str) {
    web_sys::console::log_1(&msg.into()); // => console.log(msg) from Rust
}
```

**Key Takeaway**: `web-sys` provides Rust bindings to all browser Web APIs; enable only needed features in `[features]` to control binary size. Use `.dyn_into::<T>()` to cast `Element` to specific DOM types.

**Why It Matters**: `web-sys` enables Rust code to drive the full browser DOM and Canvas API without any JavaScript glue code — the Rust function is the event handler, the Rust function draws on the canvas, the Rust function makes the fetch request. This is how Figma's rendering engine and Canva's image editor use Rust for complex rendering logic that calls into WebGL directly, without a JS middleware layer introducing latency or object allocation overhead.

---

## Example 35: Calling JS Functions from Rust with js_sys and extern "C"

`js_sys` provides bindings to JavaScript built-in objects (`Math`, `Array`, `Date`, `Promise`, etc.). For custom JS functions, use the `#[wasm_bindgen]` extern block to declare them as importable from Rust.

```rust
// src/lib.rs — calling JS from Rust via js_sys and extern blocks
use wasm_bindgen::prelude::*;
use js_sys::{Math, Date, Array};

// Use js_sys built-ins directly from Rust
#[wasm_bindgen]
pub fn random_between(min: f64, max: f64) -> f64 {
    min + (max - min) * Math::random() // => calls JavaScript Math.random()
                                         // => result: uniformly distributed in [min, max)
}

#[wasm_bindgen]
pub fn current_timestamp() -> f64 {
    Date::now()   // => calls JavaScript Date.now()
                   // => returns milliseconds since Unix epoch as f64
}

// Import a custom JS function using extern block
#[wasm_bindgen]
extern "C" {
    // This function must be provided in the importObject or as a global
    fn alert(s: &str);                      // => window.alert from Rust
    fn custom_callback(value: i32) -> bool; // => custom JS function
}

#[wasm_bindgen]
pub fn notify_user(msg: &str) {
    alert(msg);   // => calls window.alert(msg)
}

// Create JS arrays from Rust
#[wasm_bindgen]
pub fn make_js_array(n: u32) -> Array {
    let arr = Array::new_with_length(n);    // => new Array(n)
    for i in 0..n {
        arr.set(i, JsValue::from(i * i));   // => arr[i] = i*i
    }
    arr  // => returns JS Array to JavaScript caller
}
```

**Key Takeaway**: `js_sys` provides bindings to JavaScript built-ins (Math, Date, Array); `extern "C"` blocks with `#[wasm_bindgen]` declare custom JS functions that Rust can call as imports.

**Why It Matters**: The ability to call any JavaScript function from Rust — including browser APIs, third-party JS libraries, and application callbacks — means Rust Wasm is not isolated. You can write the performance-critical number crunching in Rust while still calling your existing JS charting library, your analytics SDK, or your framework's routing API. The `extern "C"` import pattern is what makes Rust Wasm a practical choice for incrementally porting a JS application to Rust rather than requiring a full rewrite.

---

## Example 36: wasm-pack Build Targets

`wasm-pack build` supports multiple targets that differ in their module format, import style, and bundler compatibility. Choosing the right target is critical for integration with your JavaScript build toolchain.

```bash
# Target: web — ESM with inline init() function
# Use with: Vite, static HTML, no bundler needed
wasm-pack build --target web
# => pkg/wasm_greet.js uses:
# =>   import * as wasm from './wasm_greet_bg.wasm?url';
# =>   export async function init() { ... }
# => Consumer: import init, { add } from './pkg/wasm_greet.js'; await init();

# Target: bundler — ESM with bundler-processed Wasm import
# Use with: Webpack 5 (syncWebAssembly/asyncWebAssembly), Rollup, esbuild
wasm-pack build --target bundler
# => pkg/wasm_greet.js uses:
# =>   import * as wasm from './wasm_greet_bg.wasm';
# =>   export { add }; // no init() needed — bundler handles instantiation
# => Consumer: import { add } from './pkg/wasm_greet.js'; add(1, 2);

# Target: nodejs — CommonJS for Node.js
# Use with: Node.js scripts, Jest, server-side rendering
wasm-pack build --target nodejs
# => pkg/wasm_greet.js uses:
# =>   const wasm = require('./wasm_greet_bg');
# =>   const { add } = require('./pkg/wasm_greet.js');

# Target: no-modules — global variable (legacy, browser only)
# Use with: old-school <script> tags, no bundler, no ESM
wasm-pack build --target no-modules
# => pkg/wasm_greet.js sets window.wasm_greet = { add, ... }
# => <script src="pkg/wasm_greet.js"></script>

# Add --release for optimized build (default is debug with assertions)
wasm-pack build --target web --release
# => smaller binary, no debug assertions, better performance
```

**Key Takeaway**: The `--target` flag determines the module format. Use `web` for unbundled browser apps, `bundler` for Webpack/Vite/Rollup, `nodejs` for Node.js, and `no-modules` for legacy `<script>` tag usage.

**Why It Matters**: Using the wrong target is one of the top causes of "it doesn't work in my project" issues. `--target bundler` in a non-bundled HTML file fails because there is no bundler to process the `.wasm` import. `--target web` in a Jest test fails because Jest does not support ESM by default. Matching the target to your toolchain is a prerequisite for a working integration — check your package.json's `type` field and bundler config before choosing.

---

## Example 37: Consuming wasm-pack Output in Vite and Next.js

Vite and Next.js (App Router) have different Wasm integration patterns. Vite supports Wasm out of the box with the `?init` URL suffix; Next.js requires the `asyncWebAssembly` experiment flag and specific import patterns.

```javascript
// vite-usage.js — Vite integration (Vite 5+)
// Vite can load .wasm files directly using the ?init query
// Requires: vite.config.ts with no special plugin for basic usage

// Option 1: ?init suffix — Vite provides instantiation wrapper
import initWasm from "./pkg/wasm_greet_bg.wasm?init";
// => Vite handles fetch + instantiation
const instance = await initWasm({
  "./wasm_greet_bg.js": (await import("./pkg/wasm_greet.js")).default,
});

// Option 2: wasm-pack --target web with Vite (recommended)
import init, { add } from "./pkg/wasm_greet.js"; // => ESM import
await init(); // => fetches wasm_greet_bg.wasm relative to wasm_greet.js
console.log(add(3, 4)); // => 7
```

```javascript
// next-usage.js — Next.js App Router (Next.js 14+)
// next.config.ts must enable asyncWebAssembly experiment:
// const nextConfig = { experimental: { asyncWebAssembly: true } };
// module.exports = nextConfig;

// In a Server Component or API Route:
// Import the JS bindings (Next.js bundler handles the .wasm file)
import init, { add } from "@/lib/wasm/wasm_greet.js"; // => placed in lib/wasm/

export async function GET() {
  await init(); // => loads .wasm from static assets
  const result = add(10, 20); // => 30
  return Response.json({ result });
}
```

```typescript
// next.config.ts — required Next.js Wasm configuration
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    asyncWebAssembly: true, // => enables Wasm module imports
  },
};

export default nextConfig;
```

**Key Takeaway**: Vite supports wasm-pack `--target web` output with no extra config; Next.js requires `experimental: { asyncWebAssembly: true }` in `next.config.ts`. Always `await init()` before calling exported functions.

**Why It Matters**: Next.js's default module handling does not support `.wasm` file imports without the experiment flag — the build fails with `ModuleParseError`. With the flag enabled, Next.js treats `.wasm` as an async module and handles streaming instantiation through its bundler. The `--target web` output from wasm-pack is the most compatible across both Vite and Next.js because it uses a standard `init()` function pattern rather than relying on bundler-specific Wasm import syntax.

---

## Example 38: Async Rust in Wasm — wasm-bindgen-futures

Wasm is single-threaded in browsers (no OS threads by default). Async Rust compiles to a state machine that the browser's event loop drives via JavaScript Promises. `wasm-bindgen-futures` bridges Rust `Future` and JavaScript `Promise`.

```toml
# Cargo.toml — async dependencies
[dependencies]
wasm-bindgen = "0.2.120"
wasm-bindgen-futures = "0.4"    # => Future ↔ Promise bridge
js-sys = "0.3"                   # => JavaScript built-ins
web-sys = { version = "0.3", features = ["Window", "Request", "Response", "Headers"] }
```

```rust
// src/lib.rs — async Wasm with wasm-bindgen-futures
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;  // => converts JS Promise to Rust Future
use web_sys::{Request, Response};

// async fn exported as returning a Promise in JS
#[wasm_bindgen]
pub async fn fetch_text(url: String) -> Result<String, JsValue> {
    let window = web_sys::window().unwrap();

    // window.fetch() returns a JS Promise
    let resp_value = JsFuture::from(window.fetch_with_str(&url))
        .await                          // => awaits the JS fetch() Promise
        .map_err(|e| e)?;              // => propagate JS errors as JsValue

    let resp: Response = resp_value.dyn_into()?; // => cast to Response

    // resp.text() returns another JS Promise
    let text = JsFuture::from(resp.text()?)
        .await?                         // => awaits text() Promise
        .as_string()                    // => JsValue → Option<String>
        .ok_or_else(|| "not a string".into())?;

    Ok(text) // => returned as resolved JS Promise value
}

// spawn_local: run an async task without awaiting (fire-and-forget)
#[wasm_bindgen]
pub fn start_background_task() {
    wasm_bindgen_futures::spawn_local(async {
        let result = fetch_text("https://api.example.com/data".into()).await;
        match result {
            Ok(text) => web_sys::console::log_1(&text.into()),
            Err(e) => web_sys::console::error_1(&e),
        }
    });
}
```

```javascript
// async-usage.js
import init, { fetch_text, start_background_task } from "./pkg/wasm_greet.js";
await init();

// async Rust fn exports as async JS fn (returns Promise)
const text = await fetch_text("https://httpbin.org/get");
console.log(text); // => JSON response body as string

start_background_task(); // => fires async task without awaiting
```

**Key Takeaway**: `#[wasm_bindgen] pub async fn` exports as an async JS function returning a `Promise`. `JsFuture::from(promise).await` bridges JS Promises to Rust `await`. `spawn_local` runs fire-and-forget async tasks on the browser event loop.

**Why It Matters**: Without async support, Rust Wasm code must use callbacks for all I/O — a callback pyramid that undermines Rust's readability advantages. `wasm-bindgen-futures` enables writing Rust Wasm code with the same `async/await` ergonomics as modern JavaScript, while the generated Promise interface is indistinguishable from a native async JS function to the caller. This is how Rust Wasm backend SDK calls, database queries via WASM DB drivers, and network requests are structured in production applications.

---

## Example 39: Hello World with Emscripten 5.0.6

Emscripten compiles C and C++ to WebAssembly. Version 5.0.6 (April 14, 2026) requires Node.js 18.3.0+ (breaking change from previous minimum of 12.22.0). The `emcc` compiler produces a `.wasm` binary plus a JavaScript loader file.

```bash
# Install Emscripten (using emsdk)
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install 5.0.6               # => downloads and installs Emscripten 5.0.6
./emsdk activate 5.0.6              # => sets up PATH for this version
source ./emsdk_env.sh               # => activates in current shell

emcc --version                      # => emcc (Emscripten gcc/clang-like replacement)...
                                     # => version: 5.0.6
```

```c
// hello.c — basic C hello world for Emscripten compilation
#include <stdio.h>

int main() {
    printf("Hello from C via WebAssembly!\n");  // => standard C printf
    return 0;                                    // => exit code 0
}
```

```bash
# Compile C to WebAssembly + HTML (full standalone demo)
emcc hello.c -o hello.html
# => produces 3 files:
# => hello.html  — browser wrapper with Emscripten JS runtime
# => hello.js    — Emscripten runtime + module loader
# => hello.wasm  — the WebAssembly binary

# Serve and open (Emscripten HTML requires a server, not file://)
npx serve .                         # => serves on http://localhost:3000
# open http://localhost:3000/hello.html
# => browser runs C main(), printf output appears in JS console + emterm

# Compile to just .wasm + .js (no HTML wrapper)
emcc hello.c -o hello.js
# => hello.js    — CommonJS module (can be required in Node.js)
# => hello.wasm  — Wasm binary

# Run with Node.js (requires Node.js 18.3.0+)
node hello.js
# => Output: Hello from C via WebAssembly!
```

**Key Takeaway**: `emcc` (Emscripten C compiler) compiles C/C++ to Wasm + JS loader. Use `-o output.html` for a browser demo, `-o output.js` for a Node.js-compatible module. Requires Node.js 18.3.0+ in Emscripten 5.0.6.

**Why It Matters**: Emscripten is the gold standard for porting C/C++ codebases to the web — it emulates POSIX APIs (file I/O, networking, pthreads) over the browser's Web APIs. Libraries like SQLite, libvips, FFmpeg, OpenCV, and LLVM have been ported to the browser via Emscripten. The Node.js 18.3.0+ requirement in 5.0.6 is a breaking change that can silently fail in CI environments still running Node.js 16 — check your CI runner's Node.js version before upgrading Emscripten.

---

## Example 40: Exporting C Functions to JS with Emscripten

By default, Emscripten only exports `main`. To export specific C functions, declare them with `EMSCRIPTEN_KEEPALIVE` (prevents dead-code elimination) and specify them in `EXPORTED_FUNCTIONS`. The `EM_JS` macro embeds inline JavaScript in the C source.

```c
// math-exports.c — exporting C functions via Emscripten
#include <emscripten.h>  // => provides EMSCRIPTEN_KEEPALIVE, EM_JS, EM_ASM

// EMSCRIPTEN_KEEPALIVE: prevents compiler from eliminating this function
// as dead code, and marks it for export to JS
EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
    return a + b;    // => basic C integer addition
}

EMSCRIPTEN_KEEPALIVE
double power(double base, double exp) {
    double result = 1.0;
    for (int i = 0; i < (int)exp; i++) {
        result *= base;  // => naive power (for demonstration)
    }
    return result;
}

// EM_JS: embed JavaScript directly in C source
// Called like a normal C function but executes JavaScript
EM_JS(void, log_from_c, (const char* msg), {
    // This is JavaScript code — runs when C calls log_from_c(str)
    console.log("C says: " + UTF8ToString(msg));  // => UTF8ToString converts ptr to JS string
})

int main() {
    log_from_c("main() called");  // => calls the EM_JS JavaScript
    return 0;
}
```

```bash
# Compile with explicit exported functions
emcc math-exports.c -o math.js \
  -s EXPORTED_FUNCTIONS='["_add", "_power", "_main"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'
# => _add and _power are prefixed with _ in the Wasm export table
# => EXPORTED_RUNTIME_METHODS exposes ccall/cwrap for easier calling

# Run in Node.js
node -e "
const Module = require('./math.js');
Module.onRuntimeInitialized = () => {
  const add = Module.cwrap('add', 'number', ['number', 'number']);
  console.log(add(3, 4)); // => 7
};
"
```

**Key Takeaway**: `EMSCRIPTEN_KEEPALIVE` prevents dead-code elimination and marks C functions for export. The `EXPORTED_FUNCTIONS` flag explicitly lists exported symbols (with `_` prefix). `EM_JS` embeds inline JavaScript callable as C functions.

**Why It Matters**: Emscripten's dead-code elimination is aggressive — without `EMSCRIPTEN_KEEPALIVE` or `EXPORTED_FUNCTIONS`, functions not reachable from `main()` are silently eliminated. This causes "function not found" errors at runtime. The `_` prefix convention is inherited from C symbol mangling — `EXPORTED_FUNCTIONS` requires it, but `cwrap` and `ccall` use the name without the prefix. Understanding this naming convention prevents half of Emscripten integration bugs.

---

## Example 41: Calling JavaScript from C with emscripten_run_script and EM_JS

Emscripten provides multiple ways for C/C++ code to call JavaScript: `emscripten_run_script` (simple string eval), `EM_JS` (inline JS in C, type-safe), and `EM_ASM` (inline JS expression, no return value).

```c
// js-from-c.c — different ways to call JS from C with Emscripten
#include <emscripten.h>
#include <stdio.h>

// EM_JS: define a JS function callable from C
// Syntax: EM_JS(return_type, function_name, (params), { js_body })
EM_JS(int, js_add, (int a, int b), {
    return a + b;    // => this JavaScript runs when C calls js_add(a, b)
                      // => a and b are automatically converted from C int to JS number
});

// EM_JS with string parameter: uses Emscripten's UTF8ToString helper
EM_JS(void, js_alert, (const char* msg), {
    alert(UTF8ToString(msg));  // => UTF8ToString converts C string pointer to JS string
                                // => alert(msg) shows browser alert dialog
});

// EM_JS returning a double
EM_JS(double, js_sqrt, (double x), {
    return Math.sqrt(x);  // => calls JavaScript Math.sqrt
});

int main() {
    int sum = js_add(10, 20);            // => calls embedded JS: returns 30
    printf("js_add(10, 20) = %d\n", sum); // => Output: js_add(10, 20) = 30

    double root = js_sqrt(2.0);           // => Math.sqrt(2.0)
    printf("sqrt(2) = %f\n", root);       // => Output: sqrt(2) = 1.414214

    // EM_ASM: inline JS expression (no return value, no name)
    EM_ASM({
        console.log("Inline JS from C: " + $0);  // => $0 is first arg
    }, 42);  // => Output: Inline JS from C: 42

    // emscripten_run_script: eval a string (slow, for debugging only)
    emscripten_run_script("console.log('run_script called')");
    // => Output: run_script called

    return 0;
}
```

**Key Takeaway**: Use `EM_JS` for defined, typed JS functions callable from C (preferred); `EM_ASM` for inline JS expressions without return; `emscripten_run_script` only for quick debugging (it's slow — it calls `eval`).

**Why It Matters**: `EM_JS` is the correct production pattern for C-to-JS calls because it is type-safe, efficient (compiled into the Wasm binary as an import), and tool-visible. `emscripten_run_script` uses `eval()` which is slow (full JS parse + compile on each call) and fails in strict CSP environments that block `eval`. Production Emscripten code uses `EM_JS` or wasm-bindgen-style JS-native callback registration instead.

---

## Example 42: malloc and free in Emscripten — Passing Allocated Buffers

Emscripten includes a full C heap allocator. JavaScript can access this heap through the Emscripten module's `_malloc` and `_free` exports, writing data into C memory before calling C functions that operate on it.

```c
// buffers.c — malloc/free with cross-boundary buffer passing
#include <stdlib.h>
#include <string.h>
#include <emscripten.h>

// Process a byte array in-place (invert each byte)
EMSCRIPTEN_KEEPALIVE
void invert_bytes(uint8_t* data, int len) {
    for (int i = 0; i < len; i++) {
        data[i] = 255 - data[i];   // => invert each byte in-place
    }
}

// Return a newly malloc'd buffer (caller must free!)
EMSCRIPTEN_KEEPALIVE
uint8_t* create_pattern(int size) {
    uint8_t* buf = (uint8_t*)malloc(size);  // => allocate on C heap
    for (int i = 0; i < size; i++) {
        buf[i] = (uint8_t)(i % 256);        // => fill with 0,1,2,...,255,0,1,...
    }
    return buf;   // => return pointer (JS must read, then free)
}
```

```javascript
// malloc-usage.js — JavaScript side of malloc/free pattern
const Module = await require("./buffers.js");

// Wait for Emscripten runtime to initialize
await new Promise((resolve) => {
  Module.onRuntimeInitialized = resolve;
});

// Allocate memory in C heap, write from JS, process in C
const size = 1024;
const ptr = Module._malloc(size); // => allocate 1024 bytes in C heap
const heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, size);
// => HEAPU8 is Emscripten's Uint8Array view over C heap

for (let i = 0; i < size; i++) {
  heapBytes[i] = i % 256; // => fill from JS side
}

Module._invert_bytes(ptr, size); // => C function inverts in-place

// Read results back
console.log([...heapBytes.slice(0, 4)]); // => [255, 254, 253, 252]

Module._free(ptr); // => CRITICAL: free C heap allocation
// => forgetting this leaks C heap memory

// Get a malloc'd buffer from C, read it, then free
const bufPtr = Module._create_pattern(256);
const buf = new Uint8Array(Module.HEAPU8.buffer, bufPtr, 256);
console.log([...buf.slice(0, 5)]); // => [0, 1, 2, 3, 4]
Module._free(bufPtr); // => free the C-allocated buffer
```

**Key Takeaway**: Emscripten exposes `_malloc` and `_free` to JavaScript. Access the C heap via `Module.HEAPU8.buffer` (a typed array view). Always call `_free` on every `_malloc` — C heap leaks do not trigger browser GC.

**Why It Matters**: The malloc/free pattern is unavoidable when working with Emscripten C libraries that accept or return heap-allocated data (image buffers, audio frames, document parse results). Missing a `_free` causes the C heap to grow without bound — since this is inside Wasm linear memory, it eventually triggers an OOM trap. In long-running applications (a browser-based editor, a media player), this manifests as a memory leak that grows linearly with usage. The Emscripten `ASAN` build (`-fsanitize=address`) detects these leaks in development.

---

## Example 43: Porting a C Image Processing Function — Grayscale

A complete end-to-end example: a C grayscale conversion function compiled with Emscripten, driven from JavaScript with Canvas API image data. This is the canonical pattern for porting image processing code to the browser.

```c
// grayscale.c — grayscale conversion in C for Emscripten
#include <stdint.h>
#include <emscripten.h>

// Convert RGBA image to grayscale in-place
// data: pointer to RGBA pixel buffer (4 bytes per pixel)
// len: total number of bytes (width * height * 4)
EMSCRIPTEN_KEEPALIVE
void to_grayscale(uint8_t* data, int len) {
    for (int i = 0; i < len; i += 4) {
        // Standard luminance formula: Y = 0.299R + 0.587G + 0.114B
        uint8_t r = data[i];        // => red channel
        uint8_t g = data[i + 1];    // => green channel
        uint8_t b = data[i + 2];    // => blue channel
        // data[i + 3] is alpha — leave unchanged

        uint8_t gray = (uint8_t)(0.299 * r + 0.587 * g + 0.114 * b);
        // => weighted average: green contributes most to perceived brightness

        data[i]     = gray;  // => overwrite R with gray
        data[i + 1] = gray;  // => overwrite G with gray
        data[i + 2] = gray;  // => overwrite B with gray
        // data[i + 3] unchanged (preserve alpha)
    }
}
```

```javascript
// grayscale-usage.js — Canvas API + Emscripten grayscale
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Draw an image onto canvas first
const img = document.getElementById("source-image");
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const pixels = imageData.data; // => Uint8ClampedArray: RGBA bytes
const byteLen = pixels.length; // => width * height * 4

// Wait for Emscripten Module to load
const Module = await loadEmscriptenModule("./grayscale.js");

// Allocate C heap buffer, copy pixels in
const ptr = Module._malloc(byteLen);
Module.HEAPU8.set(pixels, ptr); // => copy from Canvas to C heap

// Run the C grayscale function (processes in-place in C heap)
Module._to_grayscale(ptr, byteLen); // => pure C computation

// Copy processed pixels back to Canvas ImageData
pixels.set(Module.HEAPU8.subarray(ptr, ptr + byteLen)); // => copy back
Module._free(ptr); // => release C heap allocation

// Put modified image data back onto canvas
ctx.putImageData(imageData, 0, 0); // => display grayscale image
```

**Key Takeaway**: The Emscripten image processing pattern: allocate in C heap (`_malloc`), copy pixels in from Canvas, call C processing function in-place, copy results back to Canvas `ImageData`, free C heap. This achieves near-native speed for pixel-level operations.

**Why It Matters**: This pattern is exactly what browser-based photo editors (Photoshop Web, Polarr, Canva) use for computationally intensive operations like blur, sharpen, noise reduction, and color grading. The C computation is typically 10-50x faster than equivalent JavaScript for pixel-level loops. The malloc/copy/free overhead is amortized over the full image — for a 4K image (33 MB of RGBA data), the C processing dominates and the copy cost is negligible. Libraries like libvips and ImageMagick have been fully ported using this exact pattern.

---

## Example 44: Dynamic Memory Growth in Emscripten

Emscripten applications can exceed their initial memory allocation when processing large data. The `-s ALLOW_MEMORY_GROWTH=1` flag enables automatic Wasm `memory.grow` calls when C `malloc` cannot satisfy an allocation from the current heap. Without this flag, `malloc` returns `NULL` when the heap is full.

```bash
# Compile with memory growth enabled
emcc large-processor.c -o large.js \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=16MB \
  -s MAXIMUM_MEMORY=512MB \
  -s EXPORTED_FUNCTIONS='["_process_large_data", "_malloc", "_free"]'
# => INITIAL_MEMORY: start with 16 MB
# => MAXIMUM_MEMORY: allow growth up to 512 MB
# => ALLOW_MEMORY_GROWTH=1: malloc calls memory.grow when needed

# Without ALLOW_MEMORY_GROWTH (default):
emcc large-processor.c -o fixed.js \
  -s INITIAL_MEMORY=64MB
# => fixed 64 MB heap: malloc returns NULL if heap is exhausted
# => no automatic growth

# Performance trade-off: ALLOW_MEMORY_GROWTH=1 disables some optimizations
# because the runtime must handle variable-length memory
# For performance-critical code with known max memory, prefer fixed initial
```

```c
// large-processor.c — dynamic memory growth scenario
#include <stdlib.h>
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int process_large_data(int size_bytes) {
    // With ALLOW_MEMORY_GROWTH=1: malloc triggers memory.grow if needed
    uint8_t* buf = (uint8_t*)malloc(size_bytes);
    if (!buf) return -1;  // => NULL on OOM even with growth (if max exceeded)

    // Process the data...
    for (int i = 0; i < size_bytes; i++) {
        buf[i] = (uint8_t)(i % 256);  // => fill pattern
    }

    free(buf);   // => release allocation
    return 0;    // => success
}
```

**Key Takeaway**: `-s ALLOW_MEMORY_GROWTH=1` enables automatic `memory.grow` when C `malloc` runs out of heap space. Without it, `malloc` returns `NULL` on heap exhaustion. Set `INITIAL_MEMORY` and `MAXIMUM_MEMORY` to bound the growth range.

**Why It Matters**: Production Emscripten applications processing user-provided data (documents, images, videos) must handle variable-size inputs. An Emscripten-compiled PDF renderer or video transcoder cannot know the document size at compile time. `ALLOW_MEMORY_GROWTH=1` is the correct setting for such applications. The performance cost is a minor overhead (an extra bounds check on each heap access in some platforms) — well worth it versus crashing when a user uploads an unexpectedly large file.

---

## Example 45: Minimizing Wasm–JS Boundary Crossings

Every function call across the Wasm–JS boundary has overhead: type conversion, argument marshalling, and potential memory copies. The key optimization principle is **batching** — minimize call frequency by passing more data per call rather than calling frequently with small data.

```javascript
// boundary-optimization.js — batching vs chatty calls

// BAD: chatty pattern — one call per pixel (millions of boundary crossings)
async function processPixelsBad(imageData) {
  const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/proc.wasm"));
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    // Each call is a boundary crossing with argument marshalling
    pixels[i] = instance.exports.processRed(pixels[i]); // => boundary crossing!
    pixels[i + 1] = instance.exports.processGreen(pixels[i + 1]); // => boundary crossing!
    pixels[i + 2] = instance.exports.processBlue(pixels[i + 2]); // => boundary crossing!
    // => 3 * (width*height) crossings for a full image = millions of crossings
  }
}

// GOOD: batch pattern — one call for the entire image
async function processPixelsGood(imageData) {
  const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/proc.wasm"));
  const memory = instance.exports.memory;
  const pixels = imageData.data;

  // Allocate a region in Wasm memory for the pixel data
  const ptr = instance.exports.alloc(pixels.length); // => one call to allocate
  new Uint8Array(memory.buffer).set(pixels, ptr); // => one TypedArray bulk copy

  instance.exports.processAllPixels(ptr, pixels.length); // => ONE boundary crossing
  // => entire image processed in Wasm

  // Read results back (one bulk copy)
  pixels.set(new Uint8Array(memory.buffer, ptr, pixels.length));
  instance.exports.dealloc(ptr, pixels.length); // => one call to free
  // => 4 crossings total vs 3 * width * height crossings
}
```

**Key Takeaway**: Minimize Wasm–JS boundary crossings by batching data into a single call. Write bulk operations that accept a pointer+length rather than element-by-element APIs. The crossing overhead is small per call but dominates when called millions of times.

**Why It Matters**: Wasm–JS boundary overhead is typically 1-10 nanoseconds per crossing (browser-dependent). For 1 million crossings on a 1000x1000 image, that's 1-10 milliseconds of pure overhead — plus CPU cache pollution from switching between JS and Wasm execution contexts. The batch pattern reduces this to ~40 nanoseconds total. Google's measurements on porting their Sheets calculation engine to Wasm showed that eliminating chatty calls was responsible for 60% of the performance improvement beyond the algorithm speedup.

---

## Example 46: postMessage and SharedArrayBuffer for Web Workers

Web Workers enable true parallelism in browsers. `SharedArrayBuffer` allows sharing Wasm memory between the main thread and workers without copying. This requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` response headers (COOP/COEP).

```javascript
// main.js — main thread: share memory with worker
const sharedMemory = new WebAssembly.Memory({
  initial: 4, // => 4 * 64KiB = 256 KiB shared
  maximum: 16, // => max 1 MiB
  shared: true, // => SharedArrayBuffer backing (requires COOP/COEP headers)
});

// Verify SharedArrayBuffer is available (blocked without COOP/COEP)
if (!(sharedMemory.buffer instanceof SharedArrayBuffer)) {
  throw new Error("SharedArrayBuffer unavailable: check COOP/COEP headers");
}

const worker = new Worker("./worker.js", { type: "module" });

// Transfer the Wasm module (compiled once, shared) and the shared memory
// postMessage with Transferable objects: zero-copy transfer of the Module
const response = await fetch("/wasm/compute.wasm");
const buffer = await response.arrayBuffer();
const module = await WebAssembly.compile(buffer); // => compile on main thread

// Send both module and shared memory to worker
// module is structured-cloneable (copied by value — it's stateless)
// sharedMemory.buffer is SharedArrayBuffer (truly shared — no copy)
worker.postMessage({ module, sharedMemory });

// Coordinate via Atomics on a control region of shared memory
const control = new Int32Array(sharedMemory.buffer);
Atomics.store(control, 0, 1); // => signal worker to start processing
Atomics.notify(control, 0, 1); // => wake up waiting worker
```

```javascript
// worker.js — Web Worker receiving shared memory
self.onmessage = async ({ data: { module, sharedMemory } }) => {
  const instance = await WebAssembly.instantiate(module, {
    env: { memory: sharedMemory }, // => worker uses the SAME backing buffer
  });

  const control = new Int32Array(sharedMemory.buffer);
  Atomics.wait(control, 0, 0); // => block until control[0] != 0 (main signals start)

  instance.exports.computeHeavyWork(); // => runs in worker thread, writes to shared memory
  // => main thread can read results from sharedMemory.buffer without copying
};
```

**Key Takeaway**: `WebAssembly.Memory({ shared: true })` creates `SharedArrayBuffer`-backed memory shareable between main thread and Web Workers. Use `Atomics.store/notify/wait` for synchronization. COOP/COEP headers are mandatory.

**Why It Matters**: The COOP/COEP requirement means `SharedArrayBuffer` is disabled on most CDN-served sites by default. Enabling it requires server configuration changes — Vercel, Netlify, and Cloudflare Pages all support custom headers. Without shared memory, every cross-thread data exchange involves `postMessage` with serialization overhead. With shared memory, a worker can write a frame buffer that the main thread's Canvas reads instantly without any copy — enabling 60 FPS rendering pipelines for Wasm-powered games and media applications.

---

## Example 47: Offloading Computation to a Web Worker

The canonical pattern for Wasm in workers: compile the module once, load it in a dedicated worker, and communicate via `postMessage`. The worker isolates heavy computation from the UI thread, preventing frame drops.

```javascript
// wasm-worker.js — the worker script
let wasmInstance = null;

// Initialize: receive module + import object from main thread
self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    // Instantiate the pre-compiled module (cheap)
    const { instance } = await WebAssembly.instantiate(data.module, {});
    wasmInstance = instance; // => cache the instance
    self.postMessage({ type: "ready" }); // => notify main thread
    return;
  }

  if (data.type === "compute" && wasmInstance) {
    const { input, jobId } = data;
    // Run computation in worker (doesn't block UI thread)
    const result = wasmInstance.exports.heavyCompute(input); // => computation
    self.postMessage({ type: "result", jobId, result }); // => send result back
    return;
  }
};
```

```javascript
// main.js — main thread: load Wasm in worker
const worker = new Worker("./wasm-worker.js", { type: "module" });

// Compile module once on main thread
const module = await WebAssembly.compileStreaming(fetch("/wasm/compute.wasm"));

// Send compiled module to worker (structured clone — module is serializable)
worker.postMessage({ type: "init", module });

// Wait for worker to be ready
await new Promise((resolve) => {
  worker.onmessage = ({ data }) => {
    if (data.type === "ready") resolve();
  };
});

// Submit jobs asynchronously
let jobId = 0;
function compute(input) {
  return new Promise((resolve) => {
    const id = ++jobId;
    worker.postMessage({ type: "compute", input, jobId: id });
    worker.addEventListener("message", function handler({ data }) {
      if (data.type === "result" && data.jobId === id) {
        worker.removeEventListener("message", handler);
        resolve(data.result); // => resolve with computation result
      }
    });
  });
}

console.log(await compute(42)); // => result from Wasm in worker
```

**Key Takeaway**: Pre-compile the Wasm module on the main thread, transfer the compiled `Module` to a worker via `postMessage`, and instantiate in the worker. Use a job queue with `postMessage` for request/response communication. The UI thread stays responsive during heavy computation.

**Why It Matters**: A Wasm function computing a 10,000-iteration physics simulation blocks the main thread for 16ms — dropping an entire frame. Moved to a worker, the UI thread is free to respond to user input and render at 60 FPS. The compiled `Module` transfer avoids re-compiling in the worker (a savings of 50-200ms for a 2 MB module). This pattern is how real-time collaborative document editors (Figma, Google Docs offline) run their conflict resolution and state computation in workers without blocking the editor UI.

---

## Example 48: wasm-opt Optimization Passes

`wasm-opt` (from Binaryen, version_129, April 1, 2026) applies optimization passes to `.wasm` binaries, reducing size and improving performance. It is the standard post-compilation optimization step for all Wasm toolchains.

```bash
# Install Binaryen (provides wasm-opt)
brew install binaryen               # => installs wasm-opt, wasm-dis, wasm-merge, etc.
wasm-opt --version                  # => wasm-opt version_129

# Basic optimization: -O3 (maximize performance)
wasm-opt -O3 -o optimized.wasm input.wasm
# => applies optimization passes: inlining, DCE, constant propagation, etc.
# => typical size reduction: 10-20% for simple modules
# => may also improve execution speed (removes dead code, enables inlining)

# Optimize for size: -Oz (minimize binary size)
wasm-opt -Oz -o small.wasm input.wasm
# => prioritizes size reduction over speed
# => typical additional reduction: 5-15% vs -O3
# => useful for download-size-critical applications

# Balanced: -O2 (good balance of size and speed)
wasm-opt -O2 -o balanced.wasm input.wasm

# Specific passes: run only named optimization passes
wasm-opt --dce --inlining --const-hoisting -o custom.wasm input.wasm
# => DCE: dead code elimination
# => inlining: inline small functions
# => const-hoisting: hoist constants out of loops

# Check size reduction
ls -lh input.wasm optimized.wasm
# => input.wasm:     1.2M
# => optimized.wasm: 980K   (18% reduction — typical range: 10-20%)

# wasm-pack integrates wasm-opt automatically in --release builds
wasm-pack build --target web --release
# => runs wasm-opt internally after wasm-bindgen processing
```

**Key Takeaway**: `wasm-opt -O3` optimizes a `.wasm` binary with typical 10-20% size reduction and potential speed improvements. `wasm-pack --release` runs `wasm-opt` automatically. Use `-Oz` for maximum size reduction.

**Why It Matters**: `wasm-opt` is not optional for production. A Rust Wasm binary without `wasm-opt` is larger and slower than necessary — dead code (monomorphized generics, unused trait impls) inflates the binary, and missed inlining opportunities leave performance on the table. For CDN-served `.wasm` files, every kilobyte saved reduces download time on mobile connections. Photoshop Web reports their `.wasm` binaries were 15% smaller after `wasm-opt` passes compared to LLVM output alone.

---

## Example 49: Measuring Wasm Performance with performance.now

WebAssembly execution is measured with the `performance.now()` high-resolution timer (sub-millisecond precision). Accurate benchmarking requires: warm-up runs (allow JIT tier-up), multiple iterations, and understanding that the first run includes compilation for some tiers.

```javascript
// benchmark.js — measuring Wasm function performance

const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/compute.wasm"));

const { fibonacci, sum_range } = instance.exports;

function benchmark(fn, label, iterations = 1000) {
  // Warm-up: allow JIT to tier up from Liftoff to TurboFan (V8)
  for (let i = 0; i < 10; i++) fn(); // => 10 warm-up runs
  // => Wasm JIT promotes hot functions to optimized tier

  // Measure
  const start = performance.now(); // => high-resolution timestamp (ms)
  for (let i = 0; i < iterations; i++) {
    fn(); // => measured iteration
  }
  const end = performance.now(); // => end timestamp

  const totalMs = end - start; // => total time in milliseconds
  const avgUs = (totalMs * 1000) / iterations; // => average in microseconds
  console.log(`${label}: ${avgUs.toFixed(2)}μs per call (${iterations} iters)`);
}

// Benchmark fib(30) — recursive exponential
benchmark(() => fibonacci(30), "fib(30)");
// => fib(30): ~8.20μs per call (1000 iters)  [values vary by machine]

// Benchmark sum_range(1, 1000000) — linear loop
benchmark(() => sum_range(1, 1_000_000), "sum(1..1M)");
// => sum(1..1M): ~120.50μs per call (1000 iters)

// Compare Wasm vs JavaScript equivalent
function jsFib(n) {
  if (n < 2) return n;
  return jsFib(n - 1) + jsFib(n - 2);
}
benchmark(() => jsFib(30), "JS fib(30)");
// => JS fib(30): ~9.10μs per call  (often close to Wasm for simple recursion)
// => Note: for larger inputs or SIMD, Wasm advantage grows significantly
```

**Key Takeaway**: Benchmark Wasm with `performance.now()` after warm-up runs. Wasm's advantage over JavaScript varies by algorithm — simple recursion is often comparable; numeric computation with SIMD and memory access patterns favors Wasm by 2-10x.

**Why It Matters**: Naive benchmarks (no warm-up, single run) produce misleading results for Wasm because V8 and SpiderMonkey use tiered compilation — the first few runs execute on a baseline tier (fast compile, slow execute), then promote to an optimized tier. Comparing a cold-start Wasm run against a warm JS run is not an apples-to-apples comparison. The correct benchmark methodology — warm-up first, measure many iterations, use `performance.now()` — is documented by the WebAssembly CG and should be used before making architectural decisions based on performance.

---

## Example 50: Streaming Compilation vs Fetch-Then-Compile

The performance difference between streaming (`instantiateStreaming`) and non-streaming (`fetch → arrayBuffer → instantiate`) compilation matters most for large modules on slow connections. Understanding when each is appropriate prevents suboptimal loading patterns.

```javascript
// compilation-comparison.js — streaming vs buffer-based compilation

// Method 1: Streaming (recommended for browser, fast connections + slow connections)
async function loadStreaming(url) {
  const start = performance.now();
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch(url), // => compilation starts as bytes arrive
    {},
  );
  console.log(`Streaming: ${(performance.now() - start).toFixed(1)}ms`);
  return instance;
}

// Method 2: Buffer-based (required when Content-Type is wrong or in Node.js)
async function loadFromBuffer(url) {
  const start = performance.now();
  const buffer = await fetch(url).then((r) => r.arrayBuffer()); // => full download first
  const { instance } = await WebAssembly.instantiate(buffer, {});
  // => compilation starts AFTER full download
  console.log(`Buffer: ${(performance.now() - start).toFixed(1)}ms`);
  return instance;
}

// Streaming advantage grows with file size
// Small module (50 KB): streaming ~20ms, buffer ~22ms (negligible difference)
// Large module (5 MB): streaming ~400ms, buffer ~600ms (streaming 33% faster)

// When to use each:
// instantiateStreaming: browser + correct Content-Type header (application/wasm)
// instantiate(buffer): Node.js, incorrect Content-Type, need to modify binary

// Detect and use best available method
async function loadBest(url, imports = {}) {
  if (typeof WebAssembly.instantiateStreaming === "function") {
    try {
      return await WebAssembly.instantiateStreaming(fetch(url), imports);
    } catch (e) {
      // Fallback if Content-Type is wrong (common with some hosting providers)
      console.warn("Streaming failed, falling back to buffer:", e.message);
    }
  }
  const buffer = await fetch(url).then((r) => r.arrayBuffer());
  return WebAssembly.instantiate(buffer, imports);
}
```

**Key Takeaway**: Streaming compilation overlaps download and compilation, providing 20-40% faster load times for large modules. It requires `Content-Type: application/wasm`. Fall back to buffer-based when the header is wrong or when in Node.js.

**Why It Matters**: For a 5 MB game Wasm module on a 3G mobile connection (1 Mbps = 40 seconds download), streaming compilation means the first functions are compiled and available while the rest is still downloading — potentially enabling faster first-interaction. The `Content-Type` requirement is enforced by browsers as a security measure (MIME type sniffing is disabled for Wasm). Teams deploying to Cloudflare Pages, AWS S3, or any static host must configure the `.wasm` MIME type explicitly or streaming silently falls back to buffer mode.

---

## Example 51: WASI Hello World in Rust — Target wasm32-wasip1

WASI (WebAssembly System Interface) enables Wasm modules to interact with the operating system: file I/O, environment variables, clock, random. WASIp1 (Preview 1) is the stable legacy version. The Rust target is `wasm32-wasip1` — the old `wasm32-wasi` target was removed from stable Rust in 1.84 (January 2025).

```bash
# Add the WASI target (NOT wasm32-wasi — that was removed in Rust 1.84!)
rustup target add wasm32-wasip1         # => installs wasm32-wasip1 target
                                          # => CRITICAL: wasm32-wasi is REMOVED (Rust 1.84+)
```

```rust
// src/main.rs — WASI Hello World (standard Rust binary, not a library)
// Note: this is main.rs (binary), not lib.rs
// No wasm-bindgen needed for WASI — uses standard Rust std

fn main() {
    // Standard Rust I/O works via WASI system calls
    println!("Hello from WASI!");    // => writes to WASI stdout fd (fd=1)
                                      // => runtime maps fd to host stdout

    // Standard file operations work via preopened directories
    // (see Example 53 for file I/O)

    // Environment variable access
    let path = std::env::var("PATH").unwrap_or_else(|_| "not set".to_string());
    // => WASI runtime provides env vars (or empty set)
    println!("PATH: {}", path);       // => Output: PATH: not set (unless runtime provides it)
}
```

```bash
# Compile to WASI binary
cargo build --target wasm32-wasip1   # => compiles for WASI target
# => produces: target/wasm32-wasip1/debug/hello-wasi.wasm

# Cargo.toml for a WASI binary (not a library — no cdylib)
# [package]
# name = "hello-wasi"
# edition = "2021"
# No [lib] section — this is a binary with main()

# Build release
cargo build --target wasm32-wasip1 --release
# => target/wasm32-wasip1/release/hello-wasi.wasm

# Run with Wasmtime v44.0.0
wasmtime target/wasm32-wasip1/release/hello-wasi.wasm
# => Output: Hello from WASI!
# => Output: PATH: not set
```

**Key Takeaway**: WASI Rust binaries target `wasm32-wasip1` (NOT `wasm32-wasi` — removed in Rust 1.84). Compile with `cargo build --target wasm32-wasip1`. Standard Rust I/O (`println!`, `std::env`) works via WASI system calls.

**Why It Matters**: The target name change from `wasm32-wasi` to `wasm32-wasip1` is a breaking change in Rust 1.84 (January 2025). CI pipelines that pinned Rust 1.83 or earlier and used `wasm32-wasi` will fail silently or with confusing errors when upgrading. The new target name is more precise — it explicitly identifies which WASI version the binary targets (WASIp1 vs WASIp2). Always use `wasm32-wasip1` for WASIp1 and `wasm32-wasip2` for WASIp2 components.

---

## Example 52: Running WASI Modules with wasmtime run

Wasmtime (v44.0.0, April 20, 2026) is the reference WASI runtime. `wasmtime run` executes a WASI module with configurable capabilities — file system access, environment variables, and network sockets must be explicitly granted.

```bash
# Basic execution: no filesystem access, no network
wasmtime run hello-wasi.wasm
# => Output: Hello from WASI!
# => Runtime: WASIp1 (Wasmtime v44 supports WASIp1, WASIp2, experimental WASIp3)

# Check Wasmtime version
wasmtime --version   # => wasmtime-cli 44.0.0

# Grant file system access with --dir
wasmtime run --dir /tmp file-reader.wasm
# => /tmp is preopened: WASI module can read/write files in /tmp
# => WASI host path /tmp is mapped to WASI guest path /tmp (same name)

# Map host path to a different guest path
wasmtime run --dir /home/user/data::/ file-reader.wasm
# => /home/user/data (host) mapped to / (guest)
# => module sees / as its root

# Pass environment variables
wasmtime run --env MY_VAR=hello env-reader.wasm
# => std::env::var("MY_VAR") returns "hello" in Rust

# Pass command-line arguments to the Wasm module
wasmtime run -- calculator.wasm add 10 20
# => std::env::args() in Rust sees: ["calculator.wasm", "add", "10", "20"]

# Run with fuel limit (prevent infinite loops in untrusted code)
wasmtime run --fuel 1000000 compute.wasm
# => module gets 1,000,000 fuel units (instructions) before termination
# => OutOfFuel error if exceeded: useful for sandbox environments

# Run a WASIp2 component (different from WASIp1 module)
wasmtime run --wasi inherit-stdio component.wasm
# => --wasi flags configure WASIp2 world capabilities
```

**Key Takeaway**: `wasmtime run` executes WASI modules with capabilities granted by flags: `--dir` for filesystem, `--env` for environment variables, `--fuel` for instruction budget. Capabilities must be explicitly granted — WASI is capability-based, not ambient.

**Why It Matters**: WASI's capability-based security model is why Wasm is trusted in multi-tenant environments like Cloudflare Workers and Fastly Compute. A WASI module without `--dir` cannot access ANY file, even if it contains file-reading code — the capability simply is not granted. This is categorically stronger than process isolation in traditional OS sandboxing. Understanding the `--dir` host:guest path mapping is essential for deploying WASI modules that need to read configuration files or write output — you map exactly the directories they need, nothing more.

---

## Example 53: WASI File I/O — Reading and Writing Files

WASI modules access the filesystem through preopened directories granted by the runtime. From Rust's perspective, this looks like normal `std::fs` — the WASI layer translates to the host filesystem via the runtime.

```rust
// src/main.rs — WASI file I/O
use std::fs;
use std::io::{self, Write};

fn main() -> io::Result<()> {
    // Reading a file: works like normal Rust std::fs
    // Requires --dir containing /data to be granted by runtime
    let content = fs::read_to_string("/data/input.txt")?;
    // => WASI: read_to_string calls fd_read WASI syscall
    // => runtime checks if /data was preopened
    // => error if directory not granted: "capability not available"

    println!("Read {} bytes", content.len()); // => print byte count

    // Process the content
    let processed: String = content
        .lines()
        .map(|line| line.to_uppercase())       // => convert each line to uppercase
        .collect::<Vec<_>>()
        .join("\n");                            // => rejoin lines

    // Writing a file: also requires --dir to be granted
    let mut out = fs::File::create("/data/output.txt")?;
    // => creates or overwrites output.txt in preopened /data
    out.write_all(processed.as_bytes())?;      // => write UTF-8 bytes to file
    out.flush()?;                               // => flush OS buffers

    println!("Wrote processed output to /data/output.txt");
    Ok(())  // => main returns Ok(()) on success; Err propagates as non-zero exit
}
```

```bash
# Create test data
mkdir -p /tmp/wasi-data
echo -e "hello world\nfoo bar\nbaz qux" > /tmp/wasi-data/input.txt

# Compile the WASI binary
cargo build --target wasm32-wasip1 --release

# Run with /tmp/wasi-data preopened as /data (host::guest mapping)
wasmtime run \
  --dir /tmp/wasi-data::/data \
  target/wasm32-wasip1/release/file-io.wasm

# => Output: Read 21 bytes
# => Output: Wrote processed output to /data/output.txt

# Verify output
cat /tmp/wasi-data/output.txt
# => HELLO WORLD
# => FOO BAR
# => BAZ QUX
```

**Key Takeaway**: WASI file I/O uses standard Rust `std::fs` — the WASI layer translates to host filesystem syscalls. The runtime must grant directory access via `--dir host_path::guest_path`. Without the grant, file operations fail with a capability error.

**Why It Matters**: WASI's preopened directory model enables a "principle of least privilege" for file access. A WASI-based data pipeline tool that processes files in `/input` has no access to `/etc`, `/home`, or any other directory — even if the Rust code attempts to open those paths. This is why WASI is trusted for running untrusted tooling: a malicious or buggy Wasm module simply cannot escape its granted sandbox. Compare this to a native binary that has full access to the entire filesystem unless the process is in a container.

---

## Example 54: Running WASI Modules in Node.js with node:wasi

Node.js includes an experimental `node:wasi` module for running WASIp1 modules server-side without needing a separate runtime. It supports WASIp1 only (not WASIp2 or WASIp3) and is marked experimental — API may change.

```javascript
// node-wasi.js — running a WASIp1 module in Node.js
import { WASI } from "node:wasi"; // => experimental built-in
import { readFile } from "node:fs/promises";

// Configure WASI with capabilities
const wasi = new WASI({
  version: "preview1", // => WASIp1 only; "preview2" not yet supported
  args: ["my-program", "--verbose"], // => argv passed to the module
  env: {
    HOME: "/tmp", // => environment variables
    PATH: "",
  },
  preopens: {
    "/data": "/tmp/wasi-data", // => guest path: host path mapping
    // => module can access /data, which maps to /tmp/wasi-data on host
  },
  returnOnExit: true, // => return instead of process.exit() on main() return
  stdin: process.stdin.fd, // => inherit stdin from Node.js process
  stdout: process.stdout.fd, // => inherit stdout from Node.js process
  stderr: process.stderr.fd, // => inherit stderr from Node.js process
});

// Load the .wasm binary
const wasmBytes = await readFile("./hello-wasi.wasm"); // => read binary file
const { module, instance } = await WebAssembly.instantiate(
  wasmBytes,
  wasi.getImportObject(), // => WASI provides the import object
  // => imports: { wasi_snapshot_preview1: { ... } }
);

// Start the module (calls _start, which calls main())
wasi.start(instance); // => runs the WASI module
// => Output: Hello from WASI!
// => Output: PATH: not set
```

```bash
# Run the Node.js WASI script
node --experimental-wasi-unstable-preview1 node-wasi.js
# => flag required: marks WASI API as experimental
# => Output: Hello from WASI!
# => (experimental API warning may appear on stderr)
```

**Key Takeaway**: `node:wasi` runs WASIp1 modules in Node.js using `new WASI({ version: "preview1", ... })` and `wasi.start(instance)`. WASIp2 is not supported — use Wasmtime or WasmEdge for WASIp2.

**Why It Matters**: Running WASI modules in Node.js without a separate runtime is useful for testing WASI logic in CI (Node.js is universally available in CI environments; Wasmtime is not), for server-side processing of Wasm modules that share code with browser clients, and for npm packages that want to distribute platform-independent Wasm binaries runnable in both browsers and Node.js. The `node:wasi` limitation to WASIp1 means complex WASIp2 component model code needs a full WASI runtime — but for simple I/O-oriented tools, WASIp1 + Node.js is sufficient.

---

## Example 55: Generating DWARF Debug Info with Emscripten

Production debugging requires source-level information — the ability to see C/C++ source lines in Chrome DevTools rather than raw Wasm bytecode offsets. Emscripten generates DWARF debug information with `-g` and `-gseparate-dwarf`.

```bash
# Compile with full DWARF debug info embedded in the .wasm file
emcc source.c -g -o debug.wasm
# => -g: embed DWARF debug info in the .wasm binary
# => debug.wasm is much larger (MB larger than release)
# => Chrome DevTools WASM extension reads DWARF from the embedded section

# Compile with separate DWARF file (smaller production binary)
emcc source.c \
  -g \
  -gseparate-dwarf=debug.wasm.dwp \
  -o release.wasm
# => release.wasm: no debug info (production-sized)
# => debug.wasm.dwp: all DWARF info (can be served separately)
# => release.wasm contains a "external debug info" section pointing to .dwp URL

# Compile C++ with debug info and optimize (common in production builds)
em++ source.cpp \
  -O2 \
  -g \
  -gseparate-dwarf=app.wasm.dwp \
  -o app.wasm \
  -o app.js
# => optimized Wasm with separate debug info
# => optimization affects debuggability: -O0 gives best debug experience

# For Rust (wasm-pack debug build):
wasm-pack build --target web --dev
# => --dev: includes debug info (DWARF), no wasm-opt, assertions enabled
# => similar to emcc -g
```

**Key Takeaway**: `-g` embeds DWARF debug info in the Wasm binary for source-level debugging. `-gseparate-dwarf=file.dwp` separates debug info to keep the production binary small while enabling remote debugging. `wasm-pack --dev` is the Rust equivalent.

**Why It Matters**: Without DWARF, debuggin Wasm in Chrome DevTools shows only raw bytecode and numeric addresses — like debugging native code without symbols. With DWARF and the Chrome "C/C++ DevTools Support (DWARF)" extension, you can set breakpoints on C/C++ source lines, inspect local variables by name, and step through source code. This transforms Wasm debugging from "stare at hex" to "use a real debugger". The separate DWARF file pattern (`-gseparate-dwarf`) is the production approach — deploy only the small release binary, but serve the `.dwp` file for on-demand debugging without impacting load times.

---

## Example 56: Separating Debug Info from Production Binary

Separating debug information reduces production binary size significantly. The workflow: compile with DWARF debug info, split into production binary + debug file, deploy production binary, serve debug file conditionally.

```bash
# Step 1: Compile with debug info
emcc source.c -O2 -g -o with-debug.wasm
ls -lh with-debug.wasm     # => 2.1M (large: includes DWARF)

# Step 2: Strip debug info from production binary
wasm-opt with-debug.wasm -o release.wasm --strip-dwarf
# => wasm-opt (Binaryen version_129) removes DWARF sections
# => release.wasm: production-sized binary without debug data
ls -lh release.wasm        # => 410K (stripped of debug sections)

# Alternative: use LLVM's llvm-strip
llvm-strip -g with-debug.wasm -o release-llvm.wasm
# => same result: strips debug sections only

# Step 3: Extract debug info using llvm-objcopy (if using separate DWARF)
# (Emscripten's -gseparate-dwarf does this during compilation)

# Step 4: Deploy release.wasm to CDN
# Deploy debug info (separate file) to dev tooling server or conditional endpoint

# Verify production binary has no debug sections
wasm-objdump -x release.wasm | grep -i "debug"
# => (no output): no debug sections in production binary

wasm-objdump -x with-debug.wasm | grep -i "debug"
# => Custom Section ".debug_info": contains DWARF info
# => Custom Section ".debug_line": line number mapping
# => Custom Section ".debug_abbrev": DWARF abbreviations
```

**Key Takeaway**: Strip DWARF from production `.wasm` with `wasm-opt --strip-dwarf` or `llvm-strip -g`. Deploy only the stripped binary to production; serve debug info separately for developer tooling. This achieves both optimal download size and debuggability.

**Why It Matters**: A 2 MB C++ Wasm binary with DWARF can grow to 8-15 MB with full debug info — a 4-7x size inflation that directly impacts load time. Separating debug info is standard practice in native development (dSYM files on macOS, `.pdb` files on Windows, separate debuginfo packages on Linux) and the same principle applies to Wasm. The production binary stays lean; developers attach the debug info file when needed, just as a Linux developer runs `gdb` with a separate debug package.

---

## Example 57: Chrome DevTools WASM Debugging

Chrome DevTools supports source-level Wasm debugging when DWARF debug info is present (via the "C/C++ DevTools Support (DWARF)" extension). This enables breakpoints, variable inspection, and stepping through C/C++ source for Wasm modules.

```bash
# 1. Install the Chrome extension:
# Chrome Web Store: "C/C++ DevTools Support (DWARF)"
# URL: https://chromewebstore.google.com/detail/cc++-devtools-support-dwa/pdcpmagijalfljmkmjngeonclgbbannb
# => extension reads DWARF sections from .wasm files loaded by the page

# 2. Compile with debug info (DWARF embedded)
emcc source.c -g -O0 -o debug.wasm -o debug.js
# => -O0: no optimization = best variable visibility in debugger
# => -g: DWARF debug info included

# 3. Serve on localhost (WASM debugging requires HTTP, not file://)
npx serve .
# => localhost:3000

# 4. Open Chrome, navigate to your page
# 5. Open DevTools (F12) → Sources tab
# 6. After loading the page, Wasm source files appear in Sources:
# =>   wasm://wasm/source.c  ← your C source file
# =>   Click to set breakpoints on C source lines

# 7. Variable inspection in DevTools console during a breakpoint:
# => Hover over variables: see C-level names and values
# => Watch panel: add expressions like "a + b" in C context
# => Call stack: shows C function names (not wasm function indices)

# For Rust + wasm-pack:
wasm-pack build --target web --dev    # => debug build includes DWARF
# => Same DevTools workflow applies
# => Rust source lines visible in DevTools when extension is installed
```

**Key Takeaway**: The Chrome "C/C++ DevTools Support (DWARF)" extension enables source-level debugging of Wasm — set breakpoints on C/C++/Rust lines, inspect variables by name, and step through source code in Chrome DevTools. Requires debug build (`-g` or `--dev`).

**Why It Matters**: Source-level debugging transforms WebAssembly from a black box into an inspectable system. Before this extension, debugging Wasm required `console.log` from imported host functions or studying raw bytecode — both are slow and painful. With DWARF debugging, a Rust or C++ developer debugging a Wasm module in the browser uses the same mental model as debugging a native binary: set a breakpoint, run to it, inspect the call stack, hover over variables. This removes the largest barrier to porting complex C/C++/Rust code to the browser — the fear that it will be impossible to debug when something goes wrong.

---
