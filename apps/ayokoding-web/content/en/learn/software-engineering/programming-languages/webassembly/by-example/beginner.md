---
title: "Beginner"
date: 2026-04-29T00:00:00+07:00
draft: false
weight: 10000001
description: "Examples 1-28: WAT fundamentals, JavaScript API, linear memory, and AssemblyScript (0-40% coverage)"
tags: ["webassembly", "wasm", "wat", "javascript", "assemblyscript", "by-example", "beginner"]
---

## Beginner Level: WAT Fundamentals, JavaScript API, and AssemblyScript

Examples 1-28 cover WebAssembly from its binary-format fundamentals through the JavaScript host API and AssemblyScript as a typed entry point. You will learn the WAT text format, WABT tooling, linear memory, string encoding, and AssemblyScript's typed type system. By example 28, you understand what every `.wasm` file is built from.

---

## Example 1: Minimal WAT Module

A WebAssembly module is the fundamental unit of deployment and loading. Every `.wasm` binary corresponds to exactly one module. In WAT (WebAssembly Text format), a module is written as an S-expression starting with `(module ...)`. The empty module `(module)` is valid and compiles to a 9-byte binary: the 4-byte magic header `\0asm`, the 4-byte version `\1\0\0\0`, and one byte for the empty section list.

WAT uses sections internally: type, import, function, table, memory, global, export, start, element, data, and code sections. The empty module has no sections beyond the header. Compilation from WAT to binary uses `wat2wasm` from WABT 1.0.40.

```bash
# Install WABT on macOS
brew install wabt        # => installs wat2wasm, wasm-objdump, wasm-decompile, etc.

# Create the minimal WAT module
cat > empty.wat << 'EOF'
(module)                 ;; => defines an empty WebAssembly module
                         ;; => compiles to exactly 8 bytes of binary
EOF

# Compile WAT text to .wasm binary
wat2wasm empty.wat -o empty.wasm   # => reads empty.wat, writes empty.wasm
                                    # => exit code 0 on success

# Inspect binary size
ls -la empty.wasm        # => -rw-r--r--  1 user group  8 Apr 29 00:00 empty.wasm
                         # => 8 bytes: magic (4) + version (4)
```

**Key Takeaway**: The `(module)` S-expression is the root of every WAT file and compiles to a valid but empty `.wasm` binary. Every feature — functions, memory, imports, exports — is added inside this wrapper.

**Why It Matters**: Understanding the module as the unit of compilation is foundational. Runtimes like V8, SpiderMonkey, Wasmtime, and WasmEdge all load and validate modules as atomic units. A compiled Wasm module can be cached (`WebAssembly.Module`), serialized, transferred between threads, and instantiated multiple times with different import objects — the module boundary is the contract surface. Every optimization, every toolchain output, and every security sandbox boundary maps to the module concept.

---

## Example 2: Value Types in WAT

WebAssembly is a typed stack machine. The core numeric types are `i32`, `i64`, `f32`, and `f64`. As of WebAssembly 3.0, reference types (`funcref`, `externref`, `anyref`) and vector type `v128` are also available. Every value on the stack has exactly one type; operations are type-specific (there is no implicit conversion).

The type system reflects hardware: `i32`/`i64` map to 32- and 64-bit integer registers; `f32`/`f64` map to IEEE 754 floating-point registers. This enables direct CPU instruction mapping with no runtime type dispatch.

```wat
;; value-types.wat — demonstrates all core WAT value types
(module
  ;; Function returning an i32 constant
  (func (export "get_i32") (result i32)  ;; => declares func returning one i32
    i32.const 42                          ;; => pushes integer 42 onto the stack
                                          ;; => stack: [42 : i32]
  )                                       ;; => implicit return: top of stack

  ;; Function returning an i64 constant
  (func (export "get_i64") (result i64)  ;; => declares func returning one i64
    i64.const 9007199254740993            ;; => pushes 64-bit integer (> JS Number.MAX_SAFE_INTEGER)
                                          ;; => stack: [9007199254740993 : i64]
  )

  ;; Function returning an f32 constant
  (func (export "get_f32") (result f32)  ;; => declares func returning one f32
    f32.const 3.14                        ;; => pushes single-precision float
                                          ;; => stack: [3.14 : f32] (only ~7 significant digits)
  )

  ;; Function returning an f64 constant
  (func (export "get_f64") (result f64)  ;; => declares func returning one f64
    f64.const 2.718281828459045           ;; => pushes double-precision float
                                          ;; => stack: [2.718281828459045 : f64] (~15-17 significant digits)
  )
)
```

**Key Takeaway**: Wasm's four numeric types (`i32`, `i64`, `f32`, `f64`) map directly to CPU register widths; all operations are statically typed and type-checked at validation time before any execution occurs.

**Why It Matters**: The static type system is why WebAssembly can be compiled to optimized machine code ahead of time — there is no type dispatch at runtime. This is a core reason Wasm achieves near-native performance. The type information also enables safe sandboxing: the runtime validates all type constraints before execution, preventing type confusion attacks that have plagued JVM and JavaScript runtimes. When a Rust `u32` or a C `int` compiles to Wasm, it becomes an `i32` — understanding this mapping helps you reason about what your toolchain produces.

---

## Example 3: Functions in WAT

WAT functions are defined with `(func ...)`, optionally given a local name with `$name`, and can have parameters, local variables, and a result type. Functions must be explicitly exported to be visible from the JavaScript host. The execution model is a stack machine: instructions push and pop typed values; the result is whatever remains on the stack when the function returns.

```wat
;; functions.wat — function definition, locals, parameters, exports
(module
  ;; Simple function: takes two i32 params, returns their sum
  (func $add                             ;; => internal name $add (for calling within module)
    (param $a i32)                       ;; => first parameter, named $a, type i32
    (param $b i32)                       ;; => second parameter, named $b, type i32
    (result i32)                         ;; => return type: one i32
    local.get $a                         ;; => push value of param $a onto stack
                                         ;; => stack: [$a : i32]
    local.get $b                         ;; => push value of param $b onto stack
                                         ;; => stack: [$a : i32, $b : i32]
    i32.add                              ;; => pop two i32s, push their sum
                                         ;; => stack: [($a + $b) : i32]
  )                                      ;; => top of stack is the return value

  ;; Export $add as "add" to the JavaScript host
  (export "add" (func $add))             ;; => makes $add callable as module.exports.add

  ;; Function with a local variable
  (func $square
    (param $n i32)
    (result i32)
    (local $result i32)                  ;; => declare local variable $result, type i32
                                         ;; => locals are zero-initialized
    local.get $n                         ;; => push $n => stack: [$n]
    local.get $n                         ;; => push $n again => stack: [$n, $n]
    i32.mul                              ;; => pop two i32s, push product => stack: [$n*$n]
    local.set $result                    ;; => pop stack top, store in $result
                                         ;; => stack: []
    local.get $result                    ;; => push $result => stack: [$result]
  )                                      ;; => returns $result (= $n * $n)

  (export "square" (func $square))       ;; => export as "square"
)
```

**Key Takeaway**: WAT functions are pure stack machine transformations — parameters, locals, and instructions all manipulate a typed operand stack. The `(export "name" (func $f))` form is the explicit boundary between the Wasm module and the host environment.

**Why It Matters**: The function export/import mechanism is the entire API surface of a Wasm module. Every `#[wasm_bindgen]` attribute in Rust, every `EXPORTED_FUNCTIONS` in Emscripten, and every `export function` in AssemblyScript ultimately compiles to this `(export "name" (func ...))` form. Understanding this helps you debug mismatched ABIs, trace panics in generated code, and read disassembly from `wasm-objdump`.

---

## Example 4: Converting WAT to .wasm Binary with wat2wasm

WABT (WebAssembly Binary Toolkit) version 1.0.40 provides `wat2wasm` for converting WAT text to `.wasm` binary and related tools for inspection. The binary format is the only format that browsers and runtimes actually execute; WAT is a developer convenience.

```bash
# Compile WAT to Wasm binary (from Example 3's functions.wat)
wat2wasm functions.wat -o functions.wasm   # => reads text, writes binary
                                            # => validates module structure during compilation
                                            # => exit 0 on success, non-zero on error

# Check binary output
ls -lh functions.wasm    # => shows file size (typically 30-100 bytes for small modules)

# Verbose output: see all sections
wat2wasm functions.wat --dump-module       # => prints section layout to stdout
                                            # => Output: sections: type, function, export, code

# Validate a .wasm file without executing (useful for CI)
wasm-validate functions.wasm              # => exit 0 if valid Wasm binary
                                           # => exit 1 with error description if invalid

# Round-trip: decompile .wasm back to .wat
wasm2wat functions.wasm -o functions_rt.wat   # => reproduces (numbered, not named) WAT
                                               # => $add becomes (func (;0;))
```

**Key Takeaway**: `wat2wasm` validates and compiles WAT text to the standard `.wasm` binary format. WABT's toolchain enables the write-compile-inspect loop essential for learning WAT.

**Why It Matters**: WABT tools are the equivalent of `nm`, `objdump`, and `readelf` for WebAssembly binaries. In production debugging workflows, `wasm-objdump -x` and `wasm2wat` let you inspect what your toolchain actually produced — critical when a function name is missing from exports, when section sizes indicate bloat, or when `wasm-opt` transforms need auditing. Knowing how to use these tools is a core competency for anyone writing or reviewing Wasm modules in production.

---

## Example 5: Inspecting a .wasm Binary with wasm-objdump

`wasm-objdump` is the disassembler for `.wasm` files. It shows the internal section structure, imports, exports, and decoded instructions. Understanding the binary layout helps diagnose bloated bundles and missing exports.

```bash
# Full section dump of a .wasm file
wasm-objdump -x functions.wasm
# => Output:
# functions.wasm: file format wasm 0x1
#
# Section Details:
#
# Type[2]:
#  - type[0] (i32, i32) -> i32     ;; => function signature for $add
#  - type[1] (i32) -> i32          ;; => function signature for $square
#
# Function[2]:
#  - func[0] sig=0                  ;; => $add uses type[0]
#  - func[1] sig=1                  ;; => $square uses type[1]
#
# Export[2]:
#  - func[0] -> "add"               ;; => exported as "add"
#  - func[1] -> "square"            ;; => exported as "square"
#
# Code[2]:
#  - func[0] size=7 <add>           ;; => 7 bytes of bytecode for $add
#  - func[1] size=9 <square>        ;; => 9 bytes of bytecode for $square

# Disassemble instructions (--disassemble or -d)
wasm-objdump -d functions.wasm
# => Code Disassembly:
# 00002e func[0] <add>:             ;; => byte offset 0x2e in file
#  00002f: 20 00                    local.get 0     ;; => get param 0 ($a)
#  000031: 20 01                    local.get 1     ;; => get param 1 ($b)
#  000033: 6a                       i32.add         ;; => add
#  000034: 0b                       end             ;; => function end

# Show only exports
wasm-objdump -x -j Export functions.wasm   # => -j selects specific section
                                             # => Output: only Export section
```

**Key Takeaway**: `wasm-objdump -x` reveals the full internal structure of any `.wasm` file — section layout, type signatures, function indices, and export names — making it the essential inspection tool for understanding compiled Wasm.

**Why It Matters**: When `wasm-pack build` produces a 1.2 MB `.wasm` file and you expected 200 KB, `wasm-objdump -x` shows you what sections are large (typically `Code` and `Data`) and what functions were included. When a function you exported in Rust is not visible in JS, the Export section tells you the exact name Wasm sees. This is the debugging entry point before reaching for `wasm-opt` or source-map tools.

---

## Example 6: Decompiling .wasm to C-like Pseudocode with wasm-decompile

`wasm-decompile` (WABT 1.0.40) converts `.wasm` bytecode to a C-like pseudocode that is easier to read than raw WAT disassembly. It is useful for auditing compiled Wasm — especially when you did not write the WAT yourself and need to understand what a toolchain produced.

```bash
# Decompile to C-like pseudocode
wasm-decompile functions.wasm -o functions.dcmp
# => writes human-readable pseudocode to functions.dcmp

cat functions.dcmp
# => Output (approximate — format varies by WABT version):
# export function add(a:int, b:int):int {
#   return a + b;      ;; => clearly shows the addition
# }
#
# export function square(n:int):int {
#   var result:int;    ;; => shows local variable declaration
#   result = n * n;    ;; => shows multiplication assignment
#   return result;
# }

# Decompile directly to stdout (no -o flag)
wasm-decompile functions.wasm            # => prints to stdout
                                          # => same content, no file written

# Useful for third-party .wasm files
wasm-decompile vendor-lib.wasm | grep -n "function"   # => list all function names
                                                         # => helps audit foreign modules
```

**Key Takeaway**: `wasm-decompile` lifts low-level Wasm bytecode to readable C-like pseudocode, making it possible to audit any compiled `.wasm` file without access to source — invaluable for reviewing third-party libraries.

**Why It Matters**: Security audits of WebAssembly modules are a real production requirement. A `.wasm` file dropped into your supply chain via npm cannot be reviewed at the source level if the source was not shipped. `wasm-decompile` gives you a workable pseudocode representation to check for unexpected imports, suspicious memory operations, or functions that should not be exported. It also helps reverse-engineer the ABI of binary-only libraries.

---

## Example 7: Control Flow in WAT

WAT control flow uses structured constructs: `block`, `loop`, `if`/`else`, and branch instructions `br` (unconditional) and `br_if` (conditional). Unlike native assembly, WAT has **no arbitrary jumps** — branches can only target enclosing `block`, `loop`, or `if` labels. `br` on a `loop` goes to the top; `br` on a `block` exits it. This restriction enables safe, efficient compilation.

```wat
;; control-flow.wat — block, loop, if/else, br, br_if
(module
  ;; Computes absolute value of an i32
  (func $abs (param $x i32) (result i32)
    local.get $x           ;; => push $x => stack: [$x]
    i32.const 0            ;; => push 0  => stack: [$x, 0]
    i32.lt_s               ;; => signed less-than: pops two i32s, pushes 1 if $x < 0, else 0
                           ;; => stack: [($x < 0) : i32]
    if (result i32)        ;; => pop condition; enter then-branch if non-zero
      i32.const 0          ;; => push 0
      local.get $x         ;; => push $x => stack: [0, $x]
      i32.sub              ;; => 0 - $x = negation => stack: [-$x]
    else
      local.get $x         ;; => else-branch: push $x unchanged
    end                    ;; => if/else produces one i32 result (top of stack)
  )                        ;; => returns result of if/else

  (export "abs" (func $abs))

  ;; Count-down loop: counts from n down to 0, returns 0
  (func $countdown (param $n i32) (result i32)
    (local $i i32)          ;; => loop counter, initialized to 0
    local.get $n            ;; => push $n
    local.set $i            ;; => $i = $n (start at n, count down)

    block $exit             ;; => label $exit: br $exit exits this block
      loop $top             ;; => label $top: br $top restarts this loop
        local.get $i        ;; => push $i
        i32.const 0         ;; => push 0
        i32.le_s            ;; => $i <= 0?
        br_if $exit         ;; => if $i <= 0, jump to $exit (exits loop)
                            ;; => otherwise fall through

        local.get $i        ;; => push $i
        i32.const 1         ;; => push 1
        i32.sub             ;; => $i - 1
        local.set $i        ;; => $i = $i - 1 (decrement)

        br $top             ;; => unconditional jump to $top (next iteration)
      end                   ;; => end of loop $top
    end                     ;; => end of block $exit (br $exit lands here)

    local.get $i            ;; => push final $i (which is 0)
  )

  (export "countdown" (func $countdown))
)
```

**Key Takeaway**: WAT control flow is structured (no arbitrary jumps): `block`/`loop`/`if` create labeled regions, and `br`/`br_if` branch only to enclosing labels. On `loop`, `br` goes to the top; on `block`/`if`, `br` exits forward.

**Why It Matters**: The structured control flow restriction is what makes WebAssembly provably safe and efficiently compilable. Traditional assembly can jump anywhere; Wasm cannot. This property enables the runtime to compile Wasm to native code in a single forward pass without a full CFG analysis pass. It also makes Wasm modules amenable to formal verification, which is why Wasm is being adopted for smart contracts, safety-critical embedded code, and serverless edge functions where arbitrary code execution is a security boundary.

---

## Example 8: Recursive Fibonacci in WAT

Recursion in WAT uses `call` to invoke named functions. The Fibonacci example demonstrates function calls, local variables, conditional branching, and the `call` instruction — all fundamental WAT patterns. It also shows that Wasm has a call stack separate from the operand stack.

```wat
;; fibonacci.wat — recursive Fibonacci demonstrating function calls
(module
  (func $fib                    ;; => internal function, named $fib
    (param $n i32)              ;; => n: which Fibonacci number to compute
    (result i32)                ;; => returns the nth Fibonacci number
    local.get $n                ;; => push $n
    i32.const 2                 ;; => push 2
    i32.lt_s                    ;; => $n < 2?  (base case: fib(0)=0, fib(1)=1)
    if (result i32)             ;; => if $n < 2
      local.get $n              ;; => return $n directly (fib(0)=0, fib(1)=1)
    else
      local.get $n              ;; => push $n
      i32.const 1               ;; => push 1
      i32.sub                   ;; => $n - 1
      call $fib                 ;; => recursive call fib($n - 1)
                                ;; => result pushed onto stack

      local.get $n              ;; => push $n
      i32.const 2               ;; => push 2
      i32.sub                   ;; => $n - 2
      call $fib                 ;; => recursive call fib($n - 2)
                                ;; => result pushed onto stack

      i32.add                   ;; => fib($n-1) + fib($n-2)
    end                         ;; => if/else produces one i32
  )

  (export "fib" (func $fib))    ;; => export fib to JavaScript host
)
```

```javascript
// Load and call fib from JavaScript
const { instance } = await WebAssembly.instantiateStreaming(
  fetch("fibonacci.wasm"), // => fetches binary from server
);
console.log(instance.exports.fib(10)); // => 55
console.log(instance.exports.fib(20)); // => 6765
// Note: exponential time complexity — fib(40) is slow (no memoization)
```

**Key Takeaway**: The `call $functionName` instruction invokes another Wasm function by name, enabling recursion and modular code organization within a module. Each call frame gets its own locals and operand stack segment.

**Why It Matters**: Understanding that Wasm has a structured call stack — not just an operand stack — is critical for reasoning about stack depth, tail call optimization (`return_call` in Wasm 3.0 avoids stack growth for tail-recursive code), and performance. The Fibonacci example intentionally uses naive recursion to show that Wasm execution semantics are straightforward: it is a virtual machine with deterministic behavior, not a JIT that might inline or speculate differently across runs.

---

## Example 9: Loading .wasm with WebAssembly.instantiateStreaming

`WebAssembly.instantiateStreaming` is the recommended way to load a `.wasm` file in browsers. It compiles and instantiates the module from a `Response` stream — starting compilation before the full binary is downloaded, which is faster than fetching first and compiling second.

```javascript
// instantiate-streaming.js — recommended Wasm loading pattern

// instantiateStreaming takes a Promise<Response> and optional importObject
// It compiles and instantiates concurrently with the download
const result = await WebAssembly.instantiateStreaming(
  fetch("/wasm/functions.wasm"), // => fetch returns Promise<Response>
  // => compilation begins as bytes arrive
  {}, // => importObject: no imports for this module
);
// => result is { module: WebAssembly.Module, instance: WebAssembly.Instance }

const { module, instance } = result; // => destructure result
// => module: reusable, serializable compiled module
// => instance: the running instance with exports

// Access exported functions
const add = instance.exports.add; // => function reference (callable from JS)
console.log(add(3, 4)); // => 7  (calls Wasm add function)
console.log(add(100, 200)); // => 300

// Content-Type requirement: server MUST serve .wasm as application/wasm
// Chrome/Firefox enforce this; some CDNs default to application/octet-stream
// Nginx: add_type application/wasm .wasm;
// Express: res.set('Content-Type', 'application/wasm'); res.sendFile(...);
```

**Key Takeaway**: `WebAssembly.instantiateStreaming(fetch(url), importObject)` is the performance-optimal loading path — it streams compilation alongside the download and returns both the reusable `Module` and the live `Instance` in one call.

**Why It Matters**: The difference between `instantiateStreaming` and the fallback pattern (fetch → ArrayBuffer → instantiate) is significant for large modules. A 2 MB Wasm file might take 200ms to download on a mobile connection; streaming compilation can have the first functions compiled before the download finishes. The Google Chrome team reported up to 50% faster load times for large Wasm games and applications using streaming compilation. The `Content-Type: application/wasm` requirement is a security boundary — browsers refuse to compile bytes that weren't explicitly marked as Wasm.

---

## Example 10: Fallback: fetch + WebAssembly.instantiate

Some environments — Node.js without `--experimental-fetch`, older browsers, or tooling contexts — do not support `instantiateStreaming`. The fallback pattern fetches to an `ArrayBuffer` first, then compiles. This is also required when you need to modify the binary before compilation (rare but occurs in meta-tooling).

```javascript
// fallback-instantiate.js — non-streaming fallback for Node.js / older environments

async function loadWasm(url, importObject = {}) {
  // Check if streaming compilation is available
  if (WebAssembly.instantiateStreaming) {
    // => feature check
    return WebAssembly.instantiateStreaming(
      // => use streaming if available
      fetch(url),
      importObject,
    );
  }

  // Fallback: fetch full binary into memory first
  const response = await fetch(url); // => awaits full HTTP response
  const buffer = await response.arrayBuffer(); // => reads body into ArrayBuffer
  // => entire binary in memory at this point

  // Compile from buffer (not streaming)
  return WebAssembly.instantiate(buffer, importObject); // => compiles from ArrayBuffer
  // => returns { module, instance }
}

// In Node.js 18+ with built-in fetch
const { instance } = await loadWasm("./functions.wasm");
console.log(instance.exports.add(5, 6)); // => 11

// In Node.js 16 and earlier: use node-fetch or fs.readFile
import { readFile } from "fs/promises";
const buffer = await readFile("./functions.wasm"); // => reads from filesystem
const { instance: inst2 } = await WebAssembly.instantiate(buffer, {});
console.log(inst2.exports.add(7, 8)); // => 15
```

**Key Takeaway**: When `instantiateStreaming` is unavailable, fetch the full binary to an `ArrayBuffer` and use `WebAssembly.instantiate(buffer, imports)`. In Node.js, `fs.readFile` replaces `fetch` for local module loading.

**Why It Matters**: Node.js environments running Wasm modules (for shared logic with browser code, for WASI modules, or for SSR with Wasm libraries) often need the buffer-based path. The `node:fs` + `WebAssembly.instantiate` pattern is standard in Node.js Wasm scripts. Knowing both patterns is required for universal (isomorphic) Wasm loading code that works in browsers and Node.js without branching on the platform.

---

## Example 11: Calling Exported Wasm Functions from JavaScript

Once a Wasm instance is created, its exports are accessible as plain JavaScript values. Numeric exports (functions returning `i32`, `f32`, `f64`) map to JavaScript numbers. `i64` requires special handling — it maps to `BigInt` in JavaScript because `i64` exceeds `Number.MAX_SAFE_INTEGER`.

```javascript
// exported-calls.js — calling exported Wasm functions

const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/functions.wasm"));
const exports = instance.exports; // => exports object: { add: Function, square: Function, ... }

// Calling i32-returning functions: result is a JS Number
const sum = exports.add(10, 20); // => calls Wasm $add(10, 20)
// => returns 30 as JS Number (i32 → Number)
console.log(sum); // => 30
console.log(typeof sum); // => "number"

// Calling with out-of-range values: i32 truncates
const overflow = exports.add(
  2147483647, // => i32 max value (2^31 - 1)
  1, // => adding 1 causes overflow
);
console.log(overflow); // => -2147483648 (wraps around in two's complement)
// => IMPORTANT: Wasm i32 arithmetic wraps silently

// Exported memory (if module exports memory)
const memory = exports.memory; // => WebAssembly.Memory object (if exported)
const view = new Int32Array(memory.buffer); // => typed view over raw bytes

// Exported globals (if module exports a global)
// const globalVal = exports.myGlobal.value;  // => WebAssembly.Global.value

// BigInt for i64 functions
// const bigResult = exports.get_i64(); // => 9007199254740993n (BigInt suffix n)
// console.log(typeof bigResult);        // => "bigint"
```

**Key Takeaway**: Wasm exports are accessed via `instance.exports` as normal JS functions. `i32`/`f32`/`f64` map to JS `Number`; `i64` maps to JS `BigInt`. Integer arithmetic wraps silently — there is no exception on overflow.

**Why It Matters**: The `i32` wrapping behavior is a common source of bugs when porting numeric C code to Wasm. C's undefined behavior on signed overflow becomes defined wrapping in Wasm — but if your JavaScript caller expects a positive number and gets a negative one due to wrap, the result is a logic error. Understanding that `i64` requires `BigInt` on the JS side explains why `wasm-bindgen` generates specific wrapper code for 64-bit integers — direct passage would silently corrupt values above 2^53.

---

## Example 12: Importing JavaScript Functions into a Wasm Module

Wasm modules can import functions from the host (JavaScript). The import object passed to `instantiate` provides these host functions. Inside WAT, imports are declared with a two-level namespace: module name and function name. This enables Wasm to call `console.log`, DOM APIs, or custom host callbacks.

```wat
;; imports.wat — importing a JavaScript function into Wasm
(module
  ;; Import declaration: module "env", function "log_i32"
  (import "env" "log_i32"              ;; => host must provide { env: { log_i32: fn } }
    (func $log_i32 (param i32))        ;; => imported function signature: takes one i32
  )

  ;; Use the imported function inside a Wasm function
  (func $demo (export "demo")          ;; => export "demo" directly inline
    i32.const 42                       ;; => push 42
    call $log_i32                      ;; => calls JS log_i32(42)
                                        ;; => JS side prints to console
    i32.const 100                      ;; => push 100
    call $log_i32                      ;; => calls JS log_i32(100)
  )
)
```

```javascript
// Host-side import object providing the imported functions
const importObject = {
  env: {
    // => matches "env" namespace in WAT import
    log_i32: (value) => {
      // => matches "log_i32" function name
      console.log("Wasm says:", value); // => called when Wasm calls $log_i32
    },
  },
};

const { instance } = await WebAssembly.instantiateStreaming(
  fetch("/wasm/imports.wasm"),
  importObject, // => imports must match declarations exactly
);

instance.exports.demo();
// => Output: Wasm says: 42
// => Output: Wasm says: 100
```

**Key Takeaway**: Wasm imports use a two-level namespace `(import "module" "name" ...)`. The JavaScript `importObject` must exactly match this namespace structure or instantiation throws a `LinkError`.

**Why It Matters**: The import mechanism is how Wasm modules call any host capability — logging, DOM manipulation, network requests, timers, or custom host APIs. Every `wasm-bindgen`-generated binding, every Emscripten runtime call, and every WASI system call is implemented as a Wasm import. Understanding the import namespace contract explains why a `LinkError: import object field 'log_i32' is not a Function` means your import object does not match the module's declared imports. This is a foundational debugging skill.

---

## Example 13: WebAssembly.Module and WebAssembly.Instance Lifecycle

A `WebAssembly.Module` is the compiled, stateless representation of a `.wasm` binary. An `Instance` is a live running module with its own memory and global state. Separating compilation from instantiation enables the "compile once, instantiate many" pattern, which is critical for performance in scenarios with multiple workers or many module instances.

```javascript
// module-lifecycle.js — Module vs Instance lifecycle

// Step 1: Compile the module (expensive, stateless result)
const response = await fetch("/wasm/functions.wasm");
const buffer = await response.arrayBuffer(); // => full binary in memory
const module = await WebAssembly.compile(buffer); // => compilation (CPU-intensive)
// => module: WebAssembly.Module
// => stateless: no memory, no globals

// Step 2: Instantiate multiple times from the same module (cheap)
const instance1 = await WebAssembly.instantiate(module, {}); // => fresh state
const instance2 = await WebAssembly.instantiate(module, {}); // => separate state
// => each instance has own memory

// Verify instances are independent
instance1.exports.add(1, 2); // => operates on instance1's state (if stateful)
instance2.exports.add(3, 4); // => operates on instance2's state (independent)

// Modules are serializable and transferable between workers
const worker = new Worker("worker.js");
worker.postMessage(module, []); // => transfer module to worker (zero-copy)
// => worker can instantiate its own instance

// Module caching: store compiled module in IndexedDB or Cache API
// const cache = await caches.open('wasm-cache');
// cache.put('/wasm/functions.wasm', new Response(buffer));  // raw bytes
// Or serialize module: const moduleBytes = WebAssembly.Module.serialize(module);
```

**Key Takeaway**: `WebAssembly.Module` is the compiled stateless artifact; `WebAssembly.Instance` is the live running copy with its own memory. Compile once, cache the `Module`, and instantiate cheaply for each use or worker.

**Why It Matters**: For applications running Wasm in multiple Web Workers (parallel computation), sharing a compiled `Module` via `postMessage` means each worker only pays instantiation cost (cheap) not compilation cost (expensive). This pattern is used in Figma's rendering engine, Google Earth's WebAssembly port, and Shopify's storefront worker architecture. Misunderstanding this and recompiling the module in each worker wastes significant CPU time on the main thread and in each worker's initialization.

---

## Example 14: WebAssembly.compile for Pre-compilation

`WebAssembly.compile` compiles a module asynchronously from an `ArrayBuffer` or `BufferSource` without instantiating it. Use this when you want to compile eagerly (e.g., on app startup) but instantiate later (e.g., on first use or per-worker).

```javascript
// precompile.js — pre-compile at startup, instantiate on demand

// Pre-compile during app initialization (not on critical path)
let compiledModule = null;

async function precompile() {
  const buffer = await fetch("/wasm/functions.wasm").then((r) => r.arrayBuffer()); // => download binary
  compiledModule = await WebAssembly.compile(buffer); // => compile asynchronously
  // => compiledModule is WebAssembly.Module
  console.log("Wasm pre-compiled"); // => log when ready
}

// Instantiate on-demand (fast, module already compiled)
async function getInstance() {
  if (!compiledModule) {
    await precompile(); // => ensure compiled if not yet done
  }
  return WebAssembly.instantiate(compiledModule, {}); // => cheap instantiation
}

// Usage pattern: pre-compile in background, use later
precompile(); // => start compilation (no await — fire and forget)

// Later, when user action triggers Wasm usage:
const instance = await getInstance(); // => if pre-compilation finished: fast
// => if not yet done: waits for compile
console.log(instance.exports.add(1, 2)); // => 3
```

**Key Takeaway**: `WebAssembly.compile(buffer)` compiles without instantiating, returning a reusable `Module`. Pre-compile during idle time and instantiate cheaply on demand to hide compilation latency from the user interaction critical path.

**Why It Matters**: WebAssembly compilation is CPU-intensive — a 2 MB optimized module might take 50-200ms to compile even with browser JIT tiers. Doing this synchronously on user interaction would freeze the UI. Pre-compilation during idle time (requestIdleCallback) or service worker initialization eliminates perceived latency. This is the pattern used by AutoCAD Web, Microsoft Teams' media pipeline, and large WebAssembly games — the user clicks a button and the Wasm is already compiled.

---

## Example 15: WebAssembly.validate for Binary Validity Check

`WebAssembly.validate` synchronously checks whether an `ArrayBuffer` contains a valid `.wasm` binary. It returns `true` or `false` without compiling or instantiating. Use it in tooling, tests, and CI pipelines to catch corrupted or malformed modules before deploying.

```javascript
// validate.js — validate a .wasm binary without compiling it

// Valid Wasm binary: must start with magic \0asm and version \1\0\0\0
const validWasm = new Uint8Array([
  0x00,
  0x61,
  0x73,
  0x6d, // => \0asm magic header (4 bytes)
  0x01,
  0x00,
  0x00,
  0x00, // => version 1 (4 bytes)
]); // => empty module: 8 bytes total

const isValid = WebAssembly.validate(validWasm); // => synchronous check
console.log(isValid); // => true (valid empty module)

// Invalid binary: wrong magic
const invalidWasm = new Uint8Array([0xff, 0x00, 0x00, 0x00]);
console.log(WebAssembly.validate(invalidWasm)); // => false

// Invalid binary: truncated
const truncated = new Uint8Array([0x00, 0x61, 0x73]); // => magic incomplete
console.log(WebAssembly.validate(truncated)); // => false

// Use in a build pipeline test
async function verifyWasmBuild(url) {
  const buffer = await fetch(url).then((r) => r.arrayBuffer());
  if (!WebAssembly.validate(buffer)) {
    // => validate before deploying
    throw new Error(`Invalid Wasm binary at ${url}`);
  }
  console.log(`${url}: valid Wasm module`); // => passes validation
}
```

**Key Takeaway**: `WebAssembly.validate(buffer)` is a synchronous binary validity check — use it in CI pipelines, test suites, and deploy scripts to catch malformed `.wasm` files before they reach production.

**Why It Matters**: Corrupted `.wasm` files cause unhelpful runtime errors: `CompileError: wasm validation error: at offset 42: unexpected end of section or function`. Validating in CI before deployment catches this at the build step. It also verifies that post-processing steps (wasm-opt, custom patching tools, build system misconfiguration) did not corrupt the output. Teams deploying Wasm to CDNs use `wasm.validate` in their integration tests as a mandatory quality gate.

---

## Example 16: Runtime Feature Detection with wasm-feature-detect

`wasm-feature-detect` (version 1.8.0) is a browser-side library for detecting which Wasm features the current browser supports at runtime. Use it to serve optimized builds (with SIMD, threads, or GC) to capable browsers and fall back to compatible builds for others.

```javascript
// feature-detect.js — detect Wasm features at runtime
// npm install wasm-feature-detect
import {
  simd, // => detects fixed 128-bit SIMD (universally available: Chrome 91+, Firefox 89+, Safari 16.4+)
  threads, // => detects shared memory + atomic operations (requires COOP/COEP headers)
  gc, // => detects WasmGC (Baseline Dec 11, 2024: Chrome 119+, Firefox 120+, Safari 18.2+)
  relaxedSimd, // => detects Relaxed SIMD (Chrome/Firefox/Edge shipped; Safari: behind flag as of 2026)
  memory64, // => detects Memory64 (Chrome/Firefox/Edge shipped; Safari: lagging)
  tailCall, // => detects tail call optimization (Baseline Dec 11, 2024)
  exceptions, // => detects exception handling (Wasm 3.0)
} from "wasm-feature-detect";

// Detect individual features (all return Promise<boolean>)
const hasSimd = await simd(); // => true on Chrome 91+, Firefox 89+, Safari 16.4+
const hasThreads = await threads(); // => true only if COOP/COEP headers present
const hasGc = await gc(); // => true on Chrome 119+, Firefox 120+, Safari 18.2+
const hasRelaxedSimd = await relaxedSimd(); // => true Chrome/Firefox; false Safari (2026)
const hasMemory64 = await memory64(); // => true Chrome/Firefox/Edge; false Safari

console.log({ hasSimd, hasThreads, hasGc, hasRelaxedSimd, hasMemory64 });

// Load optimized vs compatible build based on features
async function loadBestModule() {
  if ((await simd()) && (await threads())) {
    return import("./wasm-simd-threads.js"); // => best performance build
  } else if (await simd()) {
    return import("./wasm-simd.js"); // => SIMD-only build
  } else {
    return import("./wasm-baseline.js"); // => universally compatible fallback
  }
}
```

**Key Takeaway**: `wasm-feature-detect` tests browser Wasm capability at runtime, enabling progressive enhancement — ship the optimized SIMD/threads/GC build to capable browsers while falling back to a compatible build for others.

**Why It Matters**: The WebAssembly ecosystem has multiple capability tiers: the 2017 MVP baseline is universally available, while SIMD/threads/GC arrived in staggered browser releases. Serving the SIMD-optimized build to a browser that doesn't support it causes an instantiation error. Feature detection + multiple build artifacts is the standard pattern used by FFmpeg.wasm (serving thread-enabled vs thread-free builds), Photoshop Web (detecting GC for managed object support), and any performance-critical Wasm application targeting all browsers.

---

## Example 17: Declaring Memory in WAT

WebAssembly linear memory is a contiguous, resizable `ArrayBuffer` measured in pages. Each page is exactly 65,536 bytes (64 KiB). Memory is declared with `(memory initial max)` where `initial` is the starting page count and `max` (optional) is the maximum. Memory starts zeroed.

```wat
;; memory.wat — declaring and using linear memory
(module
  ;; Declare memory: 1 initial page (64 KiB), max 10 pages (640 KiB)
  (memory $mem 1 10)                 ;; => 1 page = 65536 bytes initially
                                      ;; => max 10 pages = 655360 bytes
                                      ;; => memory is zero-initialized

  ;; Export memory so JavaScript can read/write it directly
  (export "memory" (memory $mem))    ;; => JS gets a WebAssembly.Memory object

  ;; Store a value into memory at byte offset 0
  (func $store_at_0 (param $val i32)
    i32.const 0                      ;; => push address: byte offset 0
    local.get $val                   ;; => push value to store
    i32.store                        ;; => store i32 at address 0 (little-endian)
                                      ;; => writes 4 bytes at offsets 0,1,2,3
  )
  (export "storeAt0" (func $store_at_0))

  ;; Load a value from memory at byte offset 0
  (func $load_at_0 (result i32)
    i32.const 0                      ;; => push address: byte offset 0
    i32.load                         ;; => load i32 from address 0 (little-endian)
                                      ;; => pops address, pushes 4-byte value
  )
  (export "loadAt0" (func $load_at_0))

  ;; Query current memory size (in pages)
  (func $page_count (result i32)
    memory.size                      ;; => pushes current page count as i32
  )
  (export "pageCount" (func $page_count))
)
```

**Key Takeaway**: Wasm memory is declared in pages (64 KiB each), starts zeroed, and is accessed via byte-offset `i32.store`/`i32.load` instructions. Exporting the memory allows JavaScript to share the same backing buffer with no copying.

**Why It Matters**: Linear memory is the fundamental data exchange mechanism between Wasm and JavaScript. When wasm-bindgen passes a `&str` from Rust to JS, it copies the UTF-8 bytes into Wasm memory and passes a pointer+length pair to JS, which reads from the same `ArrayBuffer`. Every Emscripten application uses a heap region in Wasm memory for `malloc`/`free`. Understanding pages (64 KiB increments, not bytes) is critical when sizing memory for audio buffers, image data, or large data structures.

---

## Example 18: WebAssembly.Memory Constructor

`WebAssembly.Memory` can be created in JavaScript and passed to a Wasm module as an import. This enables JavaScript to own the memory buffer, pre-populate it before instantiation, or share it with multiple modules. The `shared` option requires server-side COOP/COEP headers.

```javascript
// memory-constructor.js — creating WebAssembly.Memory in JavaScript

// Create non-shared memory: 2 pages initial (128 KiB), max 10 pages (640 KiB)
const memory = new WebAssembly.Memory({
  initial: 2, // => 2 * 65536 = 131072 bytes initially
  maximum: 10, // => max 10 * 65536 = 655360 bytes
  // shared: false   // => default: not shared (can't use with workers + SharedArrayBuffer)
});

console.log(memory.buffer.byteLength); // => 131072 (2 pages)
console.log(memory.buffer instanceof ArrayBuffer); // => true (standard ArrayBuffer)

// Pre-populate memory before passing to Wasm
const view = new Uint8Array(memory.buffer);
view[0] = 42; // => write byte 42 at offset 0
view[1] = 100; // => write byte 100 at offset 1

// Pass memory as an import to the Wasm module
const importObject = {
  env: {
    memory: memory, // => key must match the WAT import name
  },
};
const { instance } = await WebAssembly.instantiateStreaming(
  fetch("/wasm/memory.wasm"),
  importObject, // => module uses this memory instead of declaring its own
);

// Shared memory for use with Web Workers (requires COOP/COEP headers)
const sharedMemory = new WebAssembly.Memory({
  initial: 1,
  maximum: 4,
  shared: true, // => backs with SharedArrayBuffer instead of ArrayBuffer
});
console.log(sharedMemory.buffer instanceof SharedArrayBuffer); // => true
```

**Key Takeaway**: `new WebAssembly.Memory({ initial, maximum, shared })` creates a Wasm-compatible memory object in JavaScript. Pass it as an import for JS-owned memory, or use `shared: true` to create `SharedArrayBuffer`-backed memory for Web Workers.

**Why It Matters**: JS-owned memory is the pattern for applications where JavaScript drives the data layout (e.g., a game engine where JS allocates the render buffer, then passes it to a Wasm shader). Shared memory is required for multi-threaded Wasm (Emscripten pthreads, wasm-bindgen-rayon) — but it requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` response headers, which many CDNs and hosting providers do not send by default. Forgetting these headers is the most common reason threaded Wasm fails in production.

---

## Example 19: Reading and Writing Wasm Memory from JavaScript via Typed Arrays

Once you have a `WebAssembly.Memory` object (either created in JS or obtained from `instance.exports.memory`), you access it through standard JavaScript typed arrays. The memory's `buffer` property is the underlying `ArrayBuffer`.

```javascript
// memory-access.js — reading/writing Wasm memory from JavaScript

const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/memory.wasm"));

const memory = instance.exports.memory; // => WebAssembly.Memory exported from module

// Create typed views over the same ArrayBuffer
const bytes = new Uint8Array(memory.buffer); // => byte-level view
const shorts = new Int16Array(memory.buffer); // => 16-bit signed view
const ints = new Int32Array(memory.buffer); // => 32-bit signed view
const floats = new Float64Array(memory.buffer); // => 64-bit float view

// Write an i32 to offset 0 using Int32Array (index 0 = byte offset 0)
ints[0] = 12345; // => writes 4 bytes at offsets 0-3
// => little-endian: [0x39, 0x30, 0x00, 0x00]

// Verify from Wasm (if module has loadAt0)
console.log(instance.exports.loadAt0()); // => 12345 (Wasm reads same bytes)

// Write using byte view (precise control)
bytes[4] = 0xff; // => sets byte at offset 4
bytes[5] = 0x00; // => sets byte at offset 5
bytes[6] = 0x00; // => sets byte at offset 6
bytes[7] = 0x00; // => sets byte at offset 7
// => ints[1] is now 0x000000FF = 255

// IMPORTANT: After memory.grow(), existing views become detached!
// Always re-create typed array views after growth
memory.grow(1); // => grows memory by 1 page (adds 64 KiB)
// ints is now DETACHED: ints[0] throws TypeError
const ints2 = new Int32Array(memory.buffer); // => create new view after grow
console.log(ints2[0]); // => 12345 (data preserved after growth)
```

**Key Takeaway**: Wasm memory is accessed from JavaScript via typed array views over `memory.buffer`. All views (`Uint8Array`, `Int32Array`, etc.) share the same backing bytes. After `memory.grow()`, all existing views are detached — always re-create views after growth.

**Why It Matters**: The detached-view-after-grow footgun causes cryptic `TypeError: Cannot perform %TypedArray%.prototype.set on a detached ArrayBuffer` errors in production. Frameworks like wasm-bindgen generate fresh `Uint8Array(memory.buffer)` views on every boundary crossing rather than caching them — this is not inefficiency, it is correctness. Audio worklets reading Wasm output buffers must also re-create their views after any Wasm-initiated `memory.grow` call, which can happen inside the audio processing callback if not carefully managed.

---

## Example 20: Memory Grow — WAT and JavaScript

Memory growth in Wasm is explicit: `memory.grow n` grows by `n` pages and returns the old page count (or -1 on failure). Growth is the only allowed operation — Wasm memory cannot shrink. Wasm 3.0 adds multiple memories, but growth semantics are per-memory.

```wat
;; memory-grow.wat — memory.grow instruction in WAT
(module
  (memory (export "memory") 1 8)   ;; => 1 page initial, 8 pages max

  ;; Grow memory by n pages, return old size (or -1 if out of max)
  (func $grow_by (param $n i32) (result i32)
    local.get $n                   ;; => push number of pages to grow
    memory.grow                    ;; => pops n, grows by n pages
                                    ;; => pushes old page count (or -1 on failure)
  )
  (export "growBy" (func $grow_by))

  ;; Return current memory size in pages
  (func $size (result i32)
    memory.size                    ;; => pushes current page count
  )
  (export "size" (func $size))
)
```

```javascript
// memory-grow.js — growing memory from JavaScript
const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/memory-grow.wasm"));

const mem = instance.exports;

console.log(mem.size()); // => 1 (initial: 1 page = 64 KiB)

const oldSize = mem.growBy(2); // => grows by 2 pages (returns old size)
console.log(oldSize); // => 1 (previous page count)
console.log(mem.size()); // => 3 (now 3 pages = 192 KiB)

// Also grow from JavaScript directly
const mem2 = instance.exports.memory;
const beforeGrow = mem2.grow(1); // => grows by 1 page, returns old count
console.log(beforeGrow); // => 3 (old page count)
console.log(mem2.buffer.byteLength); // => 262144 (4 pages * 65536)

// Try to exceed max (8 pages): growth fails
const result = mem.growBy(10); // => requesting 10 more pages (total would be 14)
console.log(result); // => -1 (failure: exceeds max of 8 pages)
console.log(mem.size()); // => 4 (unchanged after failed grow)
```

**Key Takeaway**: `memory.grow n` grows memory by `n` pages, returning the previous page count or `-1` on failure. Growth is permanent (no shrink), page-granular (64 KiB each), and capped at the declared maximum.

**Why It Matters**: Memory growth is how `malloc`/`realloc` in Emscripten and heap allocation in Rust's Wasm allocator (wee_alloc or dlmalloc) expand the available heap. A Wasm module that runs out of memory and cannot grow (because it hit its declared max) crashes with an `OOM` trap — not a recoverable JS exception, but an unrecoverable trap. Setting the right max is an important deployment decision: too small causes production OOM; too large reserves virtual address space on 32-bit systems. The `-1` return from `memory.grow` is the only indication of failure — it must be checked.

---

## Example 21: Memory Layout — Pointer and Length Convention

Wasm has no strings or arrays as first-class types. Complex data is passed across the Wasm–JS boundary using the **pointer + length** convention: a base byte address in linear memory and a byte count. This convention is universal across all Wasm toolchains (wasm-bindgen, Emscripten, AssemblyScript).

```wat
;; pointer-length.wat — pointer+length convention for byte arrays
(module
  (memory (export "memory") 1)     ;; => 1 page = 65536 bytes

  ;; Copy n bytes from src pointer to dst pointer
  (func $copy_bytes
    (param $dst i32)               ;; => destination byte offset
    (param $src i32)               ;; => source byte offset
    (param $n i32)                 ;; => number of bytes to copy
    (local $i i32)                 ;; => loop index
    i32.const 0
    local.set $i                   ;; => $i = 0

    block $done
      loop $loop
        local.get $i               ;; => push $i
        local.get $n               ;; => push $n
        i32.ge_u                   ;; => $i >= $n? (unsigned comparison)
        br_if $done                ;; => exit loop if done

        local.get $dst             ;; => push $dst
        local.get $i               ;; => push $i
        i32.add                    ;; => dst + i (destination address)

        local.get $src             ;; => push $src
        local.get $i               ;; => push $i
        i32.add                    ;; => src + i (source address)
        i32.load8_u                ;; => load 1 byte from source (unsigned)

        i32.store8                 ;; => store 1 byte to destination

        local.get $i               ;; => push $i
        i32.const 1                ;; => push 1
        i32.add                    ;; => $i + 1
        local.set $i               ;; => $i = $i + 1
        br $loop                   ;; => next iteration
      end
    end
  )
  (export "copyBytes" (func $copy_bytes))
)
```

**Key Takeaway**: Complex data (byte arrays, strings) crosses the Wasm–JS boundary as `(ptr: i32, len: i32)` pairs — the pointer is a byte offset into linear memory, and the length is the byte count. Both sides share the same `ArrayBuffer`.

**Why It Matters**: The pointer+length convention is the universal ABI for Wasm data sharing. When you call `wasm.processImage(ptr, width * height * 4)`, you're passing an image buffer as a pointer+length pair. Understanding this explains why Rust's `wasm-bindgen` allocates a buffer in Wasm memory, copies JS data in, passes ptr+len to Rust, processes, then copies results out. It also explains `wasm-bindgen`'s `Uint8Array` zero-copy optimization — rather than copying, it passes the JS typed array's memory directly when the memory backing is the same `ArrayBuffer`.

---

## Example 22: UTF-8 String Encoding Across the Wasm–JS Boundary

Wasm has no native string type. Strings are passed as UTF-8 bytes in linear memory using the pointer+length convention. JavaScript's `TextEncoder` encodes a JS string to UTF-8 bytes; `TextDecoder` decodes UTF-8 bytes back to a JS string.

```javascript
// string-encoding.js — UTF-8 string round-trip through Wasm memory

const { instance } = await WebAssembly.instantiateStreaming(fetch("/wasm/memory.wasm"));

const memory = instance.exports.memory;
const encoder = new TextEncoder(); // => encodes JS strings to UTF-8 bytes
const decoder = new TextDecoder(); // => decodes UTF-8 bytes to JS strings

// Write a JS string into Wasm memory at offset 1000
function writeString(str, offset) {
  const bytes = encoder.encode(str); // => UTF-8 byte array (Uint8Array)
  // => "Hello, Wasm!" => [72, 101, 108, 108, ...]
  const view = new Uint8Array(memory.buffer);
  view.set(bytes, offset); // => copy bytes into Wasm memory at offset
  return bytes.length; // => return byte length (not character count!)
  // => "café" = 5 bytes (é is 2 bytes in UTF-8)
}

// Read a UTF-8 string from Wasm memory at offset/length
function readString(offset, length) {
  const view = new Uint8Array(memory.buffer);
  const bytes = view.subarray(offset, offset + length); // => slice (no copy)
  return decoder.decode(bytes); // => decodes UTF-8 → JS string
}

// Round-trip example
const str = "Hello, WebAssembly! 🦀"; // => contains non-ASCII (emoji = 4 bytes)
const offset = 1000; // => arbitrary memory location
const byteLen = writeString(str, offset);

console.log(byteLen); // => 24 (bytes, not characters; emoji = 4 bytes)
console.log(str.length); // => 21 (JS string length = code units)

const decoded = readString(offset, byteLen);
console.log(decoded === str); // => true (round-trip preserves string)
```

**Key Takeaway**: JavaScript `TextEncoder` and `TextDecoder` handle UTF-8 encoding/decoding for string exchange through Wasm linear memory. Byte length (from `encoder.encode`) differs from JS string length for non-ASCII characters.

**Why It Matters**: String handling is the most common source of Wasm-JS boundary bugs. The byte vs character length confusion (`"café".length === 4` but `encoder.encode("café").byteLength === 5`) causes buffer overflows when a Wasm function allocates `str.length` bytes but needs `byteLen` bytes. wasm-bindgen always uses `encodeURIComponent` + `encode` to get correct byte lengths. AssemblyScript's `String` type uses UTF-16 internally (like JS), avoiding UTF-8 conversion overhead at the cost of JS-side transcoding.

---

## Example 23: Exporting and Importing Memory

A module can either declare its own memory (internal) or import memory provided by the host (external). Importing memory gives the host full control over the backing buffer, enabling pre-population, sharing with other modules, or inspection before instantiation.

```wat
;; module-a.wat — declares and exports its own memory
(module
  (memory (export "memory") 1 4)   ;; => declares memory, exports it
  (func (export "storeValue")
    (param $addr i32) (param $val i32)
    local.get $addr                ;; => push address
    local.get $val                 ;; => push value
    i32.store                      ;; => store 4 bytes at addr
  )
)
```

```wat
;; module-b.wat — imports memory from host instead of declaring its own
(module
  ;; Import memory from host under namespace "env"
  (import "env" "memory" (memory 1)) ;; => expects at least 1 page from host
                                       ;; => host must provide this memory

  (func (export "readValue")
    (param $addr i32) (result i32)
    local.get $addr                ;; => push address
    i32.load                       ;; => load 4 bytes from (host-provided) memory
  )
)
```

```javascript
// share-memory.js — sharing one Memory between two modules

const sharedMem = new WebAssembly.Memory({ initial: 1, maximum: 4 });

// Instantiate module-a (it declares its own memory — different from sharedMem)
// Instantiate module-b with the shared memory
const { instance: b } = await WebAssembly.instantiateStreaming(
  fetch("/wasm/module-b.wasm"),
  { env: { memory: sharedMem } }, // => pass shared memory as import
);

// Write to shared memory from JS
new Int32Array(sharedMem.buffer)[10] = 999; // => write 999 at byte offset 40

// Read from shared memory via module-b
console.log(b.exports.readValue(40)); // => 999 (same backing buffer)
```

**Key Takeaway**: Wasm modules can declare their own memory (exported for JS access) or import memory from the host (JS-controlled). Imported memory enables multiple modules or JS to share a single backing `ArrayBuffer`.

**Why It Matters**: Memory import is the pattern used for multi-module Wasm applications where a host orchestrates data sharing. The Component Model's composed components use a similar pattern — each component has its own memory, and the host or compositor routes data between them. Understanding memory ownership (who declares, who imports) is also key to debugging "wrong module memory" bugs where a module assumes its linear address space starts at 0 but the host placed data elsewhere.

---

## Example 24: Setting Up AssemblyScript

AssemblyScript is a **strict subset of TypeScript** that compiles to WebAssembly. It is NOT a TypeScript compiler — it has no `any` type, no TypeScript union types, no reflection, and requires explicit numeric types (`i32`, `f64`, `bool`). It is designed specifically as a Wasm authoring language with TypeScript syntax.

```bash
# Initialize a new AssemblyScript project
mkdir as-project && cd as-project
npm init -y                           # => creates package.json

# Install AssemblyScript compiler (developer tool)
npm install --save-dev assemblyscript # => installs asc (AssemblyScript compiler) + loader
                                       # => version: 0.28.x

# Initialize AS project structure
npx asinit .                          # => creates:
                                       # => assembly/index.ts — entry point
                                       # => asconfig.json    — compiler config
                                       # => build/           — output directory

# Verify asc is installed
npx asc --version                     # => AssemblyScript v0.28.x

# Project structure created by asinit:
# as-project/
# ├── assembly/
# │   └── index.ts    ← write AssemblyScript here (NOT TypeScript!)
# ├── build/
# │   ├── release.wasm  ← optimized output
# │   └── debug.wasm    ← debug output
# ├── asconfig.json    ← compiler config
# └── package.json
```

```json
// asconfig.json — AssemblyScript compiler configuration
{
  "targets": {
    "debug": {
      "sourceMap": true,
      "debug": true
    },
    "release": {
      "optimizeLevel": 3,
      "shrinkLevel": 1,
      "sourceMap": false
    }
  }
}
```

**Key Takeaway**: AssemblyScript uses TypeScript syntax but is a distinct Wasm-first language — no `any`, no union types, explicit low-level numeric types. Install with `npm install --save-dev assemblyscript` and initialize with `npx asinit .`.

**Why It Matters**: The "AssemblyScript is TypeScript" misconception is one of the most common entry mistakes. Trying to use TypeScript types like `string | null` or `any` in AssemblyScript causes confusing compiler errors. AssemblyScript fills the niche of "TypeScript-adjacent syntax for Wasm authors who don't want to learn Rust or C" — it is widely used in blockchain smart contracts (Near Protocol, Polkadot), game tooling, and performance-critical npm packages that want to avoid the Rust toolchain setup cost.

---

## Example 25: Writing Typed Functions in AssemblyScript

AssemblyScript uses explicit Wasm-native types: `i32`, `i64`, `f32`, `f64`, `bool`, `u8`, `u16`, `u32`, `u64`, `usize` (pointer-sized). Functions are exported to Wasm using the `export` keyword. The `@inline` decorator requests inlining (advisory, not forced).

```typescript
// assembly/index.ts — AssemblyScript typed functions
// NOTE: This is AssemblyScript (.ts syntax), NOT TypeScript
// File lives in assembly/ directory, compiled with asc (not tsc)

// Basic arithmetic: explicit i32 types required (no number type)
export function add(a: i32, b: i32): i32 {
  return a + b; // => i32 addition (wraps on overflow, no exception)
  // => compiled to: local.get 0; local.get 1; i32.add
}

// Float64 function: TypeScript's 'number' is not valid here — must be f64
export function sqrt(x: f64): f64 {
  return Math.sqrt(x); // => AS Math.sqrt operates on f64
  // => compiled to: local.get 0; f64.sqrt
}

// Boolean return type maps to i32 in Wasm (0 = false, 1 = true)
export function isEven(n: i32): bool {
  return (n & 1) === 0; // => bitwise AND with 1: 0 means even
  // => bool compiles to i32 (0 or 1)
}

// u32: unsigned 32-bit integer (no C-style unsigned int keyword needed)
export function countBits(n: u32): i32 {
  let count: i32 = 0; // => local variable with explicit type
  for (let i: u32 = 0; i < 32; i++) {
    if (n & (1 << i)) {
      // => check bit i
      count++; // => count set bits
    }
  }
  return count; // => popcount result
}
```

```bash
# Compile AssemblyScript to Wasm
npx asc assembly/index.ts --target release --outFile build/release.wasm
# => reads assembly/index.ts
# => optimizes (level 3)
# => writes build/release.wasm

# Also produce WAT for inspection
npx asc assembly/index.ts --target debug --textFile build/debug.wat
# => builds debug binary + produces human-readable WAT
```

**Key Takeaway**: AssemblyScript requires explicit Wasm-native types (`i32`, `f64`, `bool`) instead of TypeScript's generic `number`. The `export` keyword marks functions visible to the host. Compile with `asc`, not `tsc`.

**Why It Matters**: AssemblyScript's type system is a thin layer over WAT types — `i32` in AS compiles to `i32` in WAT with no boxing or conversion. This directness is why AS is popular for high-performance numeric code: you have the same mental model as Wasm but TypeScript syntax. The distinction from TypeScript matters for build pipelines — AS source MUST NOT be processed by `ts-node`, Babel, or `tsc`. It requires `asc` from the `assemblyscript` package, a common mis-configuration error.

---

## Example 26: Compiling AssemblyScript and Loading in Browser

After writing AssemblyScript, compile with `asc` and load in the browser using `@assemblyscript/loader` or the raw WebAssembly JS API. The loader adds conveniences for string and array handling; the raw API is simpler for numeric-only modules.

```bash
# Compile to release .wasm
npx asc assembly/index.ts --target release --outFile build/release.wasm
# => builds optimized Wasm
# => exports: add, sqrt, isEven, countBits

# Inspect what was exported
wasm-objdump -x build/release.wasm | grep Export
# => Export[4]:
# =>  - func[0] -> "add"
# =>  - func[1] -> "sqrt"
# =>  - func[2] -> "isEven"
# =>  - func[3] -> "countBits"
```

```javascript
// load-as.js — loading AssemblyScript .wasm in the browser

// Method 1: Raw WebAssembly API (works for numeric-only modules)
const { instance } = await WebAssembly.instantiateStreaming(
  fetch("/build/release.wasm"),
  {}, // => no imports needed for these functions
);

const { add, sqrt, isEven, countBits } = instance.exports;

console.log(add(10, 20)); // => 30
console.log(sqrt(2.0)); // => 1.4142135623730951
console.log(isEven(42)); // => 1 (true: 1 in Wasm, not JS boolean)
console.log(isEven(7)); // => 0 (false)
console.log(countBits(255)); // => 8 (all 8 bits set in 0xFF)

// Method 2: @assemblyscript/loader (adds string/array helpers)
// npm install @assemblyscript/loader
import { instantiate } from "@assemblyscript/loader";

const wasmModule = await instantiate(
  fetch("/build/release.wasm"), // => accepts Promise<Response> or ArrayBuffer
  {}, // => import object
);
// wasmModule.exports has same functions PLUS loader helpers (__newString, __getString, etc.)
console.log(wasmModule.exports.add(3, 4)); // => 7
```

**Key Takeaway**: Compile with `npx asc --target release --outFile output.wasm`; load with the standard `instantiateStreaming` for numeric modules or `@assemblyscript/loader` for string/array support.

**Why It Matters**: The `@assemblyscript/loader` is necessary when your AssemblyScript functions accept or return `string` or `Array<T>` — the loader provides `__newString`, `__getString`, `__newArray` helpers that manage AS's GC-managed heap. Without the loader, passing strings requires manual pointer arithmetic. For numeric-only modules (cryptography, signal processing, math), the raw API is sufficient and has zero overhead. Choosing the right loading method prevents subtle bugs where string pointers are passed as raw numbers and corrupted.

---

## Example 27: AssemblyScript Linear Memory — store, load, memory.size

AssemblyScript provides direct memory access through `store<T>`, `load<T>`, and `memory.size()`. These compile to the equivalent WAT `i32.store`, `i32.load`, `memory.size` instructions with no overhead. The `changetype<i32>` function casts without conversion.

```typescript
// assembly/memory.ts — AssemblyScript memory access
// Compile: npx asc assembly/memory.ts --outFile build/memory.wasm

// Store a 32-bit integer at a byte offset
export function storeInt(offset: i32, value: i32): void {
  store<i32>(offset, value); // => writes 4 bytes at byte offset
  // => same as i32.store in WAT
}

// Load a 32-bit integer from a byte offset
export function loadInt(offset: i32): i32 {
  return load<i32>(offset); // => reads 4 bytes from byte offset
  // => same as i32.load in WAT
}

// Store an f64 at a byte offset (8 bytes)
export function storeFloat(offset: i32, value: f64): void {
  store<f64>(offset, value); // => writes 8 bytes at byte offset
}

// Load an f64 from a byte offset
export function loadFloat(offset: i32): f64 {
  return load<f64>(offset); // => reads 8 bytes from byte offset
}

// Query current memory size (in pages, each 65536 bytes)
export function getPageCount(): i32 {
  return memory.size(); // => returns current page count
  // => same as memory.size in WAT
}

// Grow memory by n pages (returns old page count or -1)
export function growMemory(pages: i32): i32 {
  return memory.grow(pages); // => grows by pages, returns old count
}

// Fill memory region with zeros (memset pattern)
export function zeroMemory(start: i32, length: i32): void {
  memory.fill(start, 0, length); // => memset to 0
  // => compiled to memory.fill instruction (Wasm bulk memory)
}
```

**Key Takeaway**: AssemblyScript's `store<T>`, `load<T>`, `memory.size()`, and `memory.grow()` compile directly to WAT memory instructions — they are zero-cost type-safe wrappers over raw Wasm memory operations.

**Why It Matters**: Direct memory access in AS is the mechanism for implementing custom allocators, data structure layouts, and interoperability with C-style memory APIs (like Emscripten-generated code). The `store<i32>` / `load<i32>` pattern with explicit byte offsets is how AS implements its own garbage-collected heap — the allocator itself is written in AS using these primitives. Understanding this lets you write efficient data serialization code without an allocator overhead.

---

## Example 28: StaticArray vs Heap Arrays in AssemblyScript

AssemblyScript offers `StaticArray<T>` (fixed size, no GC, stack/data segment) and regular `Array<T>` (heap-allocated, GC-managed, resizable). The choice impacts performance, GC pressure, and interoperability with the host.

```typescript
// assembly/arrays.ts — StaticArray vs Array in AssemblyScript
// Compile: npx asc assembly/arrays.ts --outFile build/arrays.wasm

// StaticArray<T>: fixed size at declaration, no GC overhead
// Suitable for fixed-size buffers: lookup tables, fixed-size scratch space
export function sumStaticArray(): i32 {
  const arr = new StaticArray<i32>(5); // => allocates 5 * 4 = 20 bytes in data segment
  // => no GC tracking for this array
  arr[0] = 10; // => direct store at offset 0
  arr[1] = 20; // => direct store at offset 4
  arr[2] = 30; // => direct store at offset 8
  arr[3] = 40; // => direct store at offset 12
  arr[4] = 50; // => direct store at offset 16

  let sum: i32 = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]; // => direct load from offset i*4
  }
  return sum; // => 150
}

// Array<T>: heap-allocated, GC-managed, resizable
// Use @assemblyscript/loader on JS side to handle GC-managed arrays
export function createArray(len: i32): Array<i32> {
  const arr = new Array<i32>(len); // => allocates on GC heap
  for (let i = 0; i < len; i++) {
    arr[i] = i * i; // => fill with squares
  }
  return arr; // => returns pointer to GC-managed array object
  // => JS must use loader.__getArray(ptr) to read values
}

// Efficient pattern: accept pre-allocated pointer from JS host
// (avoids GC allocation entirely for hot paths)
export function fillSquares(ptr: i32, len: i32): void {
  for (let i = 0; i < len; i++) {
    store<i32>(ptr + i * 4, i * i); // => store squares at ptr+offset
  }
}
```

```javascript
// array-usage.js — loading and using AssemblyScript arrays
import { instantiate } from "@assemblyscript/loader";

const module = await instantiate(fetch("/build/arrays.wasm"), {});

// StaticArray result (simple numeric return)
console.log(module.exports.sumStaticArray()); // => 150

// GC-managed Array<i32>: use loader to extract
const ptr = module.exports.createArray(5); // => returns pointer into Wasm heap
const arr = module.exports.__getArray(ptr); // => loader reads GC array → JS array
console.log(arr); // => [0, 1, 4, 9, 16]

// Zero-copy pattern: pre-allocate in JS, pass pointer to Wasm
const mem = new Int32Array(module.exports.memory.buffer, 1000, 5);
module.exports.fillSquares(1000, 5); // => Wasm writes at offset 1000
console.log([...mem]); // => [0, 1, 4, 9, 16]
```

**Key Takeaway**: `StaticArray<T>` is a fixed-size, GC-free array ideal for performance-critical code; `Array<T>` is heap-allocated and GC-managed, requiring the `@assemblyscript/loader` on the JS side to handle its GC pointer. For zero-copy data exchange, pre-allocate a typed array in JS and pass the byte offset to Wasm.

**Why It Matters**: Array allocation strategy is the primary performance tuning lever in AssemblyScript. Audio processing and image manipulation functions that allocate `Array<T>` on every call create GC pressure that triggers collection pauses, causing audio glitches and frame drops. Using `StaticArray<T>` or pre-allocated host-side buffers (the zero-copy pattern) eliminates GC entirely for hot paths. This is why performance-sensitive AS libraries like `assemblyscript-json` carefully distinguish when to use each type.

---
