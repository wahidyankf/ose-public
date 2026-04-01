---
title: "Advanced"
weight: 10000003
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Advanced jq examples covering user-defined functions, recursion, path expressions, format strings, streaming parser, SQL-style operations, and real-world API data processing"
tags: ["jq", "json", "data-processing", "tutorial", "by-example", "code-first", "advanced"]
---

This tutorial covers advanced jq concepts through 29 self-contained, heavily annotated
shell examples (Examples 57-85). The examples progress from user-defined functions and
recursion through path manipulation, format strings, streaming, SQL-style joins, and
real-world API data processing — spanning 70–95% of jq features.

## User-Defined Functions

### Example 57: Defining Functions with `def`

`def name(args): body;` defines a reusable named filter. Functions can take filter
arguments (not values) and are defined before the main expression.

```bash
echo '42' | jq 'def double: . * 2; double'
# => def double: . * 2; defines a function named "double"
# => The body ". * 2" doubles its input
# => double is then called on input 42
# => Output: 84

echo '[1, 2, 3, 4, 5]' | jq 'def square: . * .; map(square)'
# => def square: . * .; defines a function that squares its input
# => map(square) applies "square" to every array element
# => Output: [1, 4, 9, 16, 25]
```

**Key takeaway:** `def name: body;` defines a named filter that can be called like a built-in function — it encapsulates reusable logic and improves pipeline readability.

**Why it matters:** Complex jq programs become unreadable when every operation is inlined. Defining named functions for domain operations (e.g., `def to_iso8601: ...;`, `def normalize_user: ...;`) creates self-documenting pipelines that can be stored in a `.jq` file and reused across scripts.

---

### Example 58: Functions with Filter Arguments

jq functions can take filter arguments. The argument is a filter (not a value) that the
function applies to its input at call time.

```bash
echo '[1, 2, 3, 4, 5]' | jq 'def apply_twice(f): f | f; apply_twice(. * 3)'
# => def apply_twice(f): f | f; defines a function with filter argument f
# => f is applied twice in sequence: first . * 3, then . * 3 again
# => But this applies to the whole array! Let's fix with map:
# => apply_twice(. * 3) on input [1,2,3,4,5]
# => First f (. * 3): [3, 6, 9, 12, 15]
# => Second f (. * 3): [9, 18, 27, 36, 45]
# => Output: [9, 18, 27, 36, 45]
```

**Key takeaway:** Function arguments in `def` are filters, not values — they receive the current context (`.`) when applied, enabling higher-order function patterns.

**Why it matters:** Higher-order functions (functions that take functions as arguments) are the foundation of functional programming. In jq, this lets you write generic combinators like `apply_twice`, `retry_if`, or `transform_if_type` that work with any filter. This abstraction capability is what separates maintainable jq programs from one-off pipeline expressions.

---

### Example 59: Recursive Functions

jq functions can call themselves recursively. Combined with conditional termination,
this enables tree traversal and recursive data processing.

```bash
echo '{"a": {"b": {"c": 42}}}' | jq '
  def deep_get(key):
    if type == "object" and has(key)
    then .[key]
    elif type == "object"
    then [.[] | deep_get(key)] | add
    else empty
    end;
  deep_get("c")
'
# => deep_get recursively searches for key "c" at any depth
# => At the top level: object has "a" but not "c" => recurse into values
# => At {"b": {"c": 42}}: has "b" but not "c" => recurse into values
# => At {"c": 42}: has "c" => return .[key] => 42
# => Output: 42
```

**Key takeaway:** Recursive `def` functions with conditional base cases enable tree traversal and deep structural operations that built-in functions cannot handle.

**Why it matters:** JSON data is often a tree of unknown depth — nested configuration, recursive menu structures, file system representations. Recursive jq functions process these without hardcoding depth, adapting to any structure. This replaces Python scripts that walk recursive data structures with self-contained jq programs.

---

### Example 60: `recurse` Built-in

`recurse(f)` recursively applies `f` starting from the input, continuing as long as `f`
produces output. `recurse` (no args) emits each node in the entire JSON tree.

```bash
echo '{"a": 1, "b": {"c": 2, "d": {"e": 3}}}' | jq '[recurse | .e? // empty]'
# => recurse with no arguments streams every node in the JSON tree
# => It emits the root, then each nested value recursively
# => .e? // empty tries to access .e on each node; suppresses non-objects
# => When recurse reaches {"e": 3}, .e? returns 3
# => Output: [3]

echo '2' | jq '[limit(8; recurse(. * 2; . < 256))]'
# => recurse(f; condition) applies f repeatedly while condition is true
# => Start: 2; then 4; then 8; ... stops when . < 256 is false
# => limit(8; ...) caps at 8 outputs as a safety net
# => Output: [2, 4, 8, 16, 32, 64, 128, 256]
```

**Key takeaway:** `recurse` (no args) walks every node in the JSON tree; `recurse(f; cond)` applies `f` iteratively while `cond` is true — enabling tree traversal and iterative generation without explicit recursion.

**Why it matters:** Extracting all leaf values from a JSON tree, finding all instances of a key at any depth, and generating iterative sequences are tasks that `recurse` handles elegantly. The `recurse(f; cond)` form with a condition is safer than open-ended recursion because it prevents infinite loops.

---

## Path Expressions

### Example 61: `path` Expression

`path(expr)` returns the path (as an array of keys and indices) that leads to the
value selected by `expr`. This is the structural address of a value in a JSON document.

```bash
echo '{"user": {"profile": {"name": "Quinn"}}}' | jq 'path(.user.profile.name)'
# => path() returns the sequence of keys needed to reach the selected value
# => .user navigates to key "user"; .profile to "profile"; .name to "name"
# => The path is represented as a JSON array of strings/numbers
# => Output: ["user", "profile", "name"]
```

**Key takeaway:** `path(expr)` returns the structural address of a value as an array of keys and indices — the programmatic representation of a JSON path.

**Why it matters:** Path expressions enable structural manipulation of JSON documents — you can compute paths dynamically and then use `getpath`/`setpath`/`delpaths` to operate on arbitrary locations. This is essential for JSON patch operations, schema migration scripts, and building generic document transformation tools.

---

### Example 62: `getpath`, `setpath`, and `delpaths`

`getpath(path)` retrieves the value at a given path array. `setpath(path; value)` sets
a value at a path. `delpaths([paths])` deletes values at the given paths.

```bash
echo '{"a": {"b": {"c": 42}}}' | jq 'getpath(["a","b","c"])'
# => getpath navigates the JSON document following the path array
# => ["a","b","c"] means: go to .a, then .b, then .c
# => Output: 42

echo '{"x": 1}' | jq 'setpath(["y","z"]; 99)'
# => setpath creates the nested structure if it does not exist
# => Creates .y as an object, then .y.z as 99
# => Output: {"x": 1, "y": {"z": 99}}

echo '{"a": 1, "b": 2, "c": 3}' | jq 'delpaths([["a"],["c"]])'
# => delpaths removes all values at the listed paths
# => Removes .a and .c; .b remains
# => Output: {"b": 2}
```

**Key takeaway:** `getpath`/`setpath`/`delpaths` manipulate JSON documents at computed paths — they enable programmatic structural editing without knowing the path at query-writing time.

**Why it matters:** JSON Patch (RFC 6902) operations are implemented as path-based operations. When building tools that apply user-specified transformations to JSON documents, `setpath` and `delpaths` let you accept paths as data and apply them programmatically. This is the foundation for building generic JSON transformation engines.

---

### Example 63: `leaf_paths`

`leaf_paths` emits the path to every leaf value (non-object, non-array) in the JSON
document. It is equivalent to `path(..| scalars)`.

```bash
echo '{"a": 1, "b": {"c": 2, "d": [3, 4]}}' | jq '[leaf_paths]'
# => leaf_paths traverses the entire document tree
# => Emits the path to each scalar (non-container) value
# => .a => ["a"] (value is 1, a scalar)
# => .b.c => ["b","c"] (value is 2, a scalar)
# => .b.d[0] => ["b","d",0] (value is 3, a scalar — array index)
# => .b.d[1] => ["b","d",1] (value is 4, a scalar)
# => Output: [["a"],["b","c"],["b","d",0],["b","d",1]]
```

**Key takeaway:** `leaf_paths` emits paths to all scalar (non-container) values — use it to enumerate every settable location in a JSON document.

**Why it matters:** Schema introspection, document flattening, and deep value replacement all require knowing every leaf location. `leaf_paths` combined with `getpath` creates a "flat map" of a nested document, which is useful for displaying JSON in table form or for building document comparison tools.

---

## Update and Manipulation Operators

### Example 64: Update Operator `|=`

`expr |= f` updates the value at the location selected by `expr` by applying `f` to it.
Unlike `=`, `|=` gives `f` access to the current value via `.`.

```bash
echo '{"count": 5}' | jq '.count |= . + 1'
# => .count |= . + 1 updates the .count field in place
# => . inside the update expression refers to the CURRENT value of .count (5)
# => . + 1 computes 5 + 1 = 6
# => The result replaces .count
# => Output: {"count": 6}

echo '{"tags": ["go", "python"]}' | jq '.tags |= . + ["rust"]'
# => .tags |= . + ["rust"] appends "rust" to the existing tags array
# => . refers to the current array ["go","python"]
# => . + ["rust"] concatenates to ["go","python","rust"]
# => Output: {"tags": ["go", "python", "rust"]}
```

**Key takeaway:** `path |= f` updates the value at `path` using `f` with `.` bound to the current value — the in-place update operator that avoids reconstructing the whole object.

**Why it matters:** Updating a single field in a large JSON document using `|=` is far more concise than using object construction `{field: new_value} + del(.field)`. This operator is essential for patch operations, counter increments, and appending to nested arrays in documents.

---

### Example 65: Alternative Update `//=`

`expr //= value` sets the path selected by `expr` to `value` only if the current value
is `null` or `false`. It combines the alternative operator with update syntax.

```bash
echo '{"timeout": null}' | jq '.timeout //= 30'
# => .timeout is null => the //= condition triggers
# => .timeout is updated to 30
# => Output: {"timeout": 30}

echo '{"timeout": 60}' | jq '.timeout //= 30'
# => .timeout is 60 (not null, not false) => the //= condition does NOT trigger
# => .timeout remains unchanged at 60
# => Output: {"timeout": 60}
```

**Key takeaway:** `path //= default` sets a default value only when the current value is `null` or `false` — the in-place default-assignment operator.

**Why it matters:** Applying defaults to JSON configuration documents is a common DevOps task. `//=` applies a default to a field only when it is absent or null, leaving explicit values untouched. This is the idiomatic way to merge a default configuration object with user-provided overrides where the user's values win.

---

### Example 66: `del` Function

`del(path)` removes a key or array element at the specified path from the input
document, returning the document without that path.

```bash
echo '{"name":"Rita","password":"secret","email":"r@example.com"}' \
  | jq 'del(.password)'
# => del removes the .password field from the object
# => All other fields are preserved
# => Output: {"name": "Rita", "email": "r@example.com"}

echo '[10, 20, 30, 40, 50]' | jq 'del(.[2])'
# => del(.[2]) removes the element at index 2 from the array
# => Elements shift to fill the gap
# => Output: [10, 20, 40, 50]
```

**Key takeaway:** `del(path)` removes a key from an object or an element from an array — the structural deletion operation that leaves all other paths intact.

**Why it matters:** Removing sensitive fields before logging (passwords, tokens, PII), cleaning up internal metadata fields before sending API responses, and implementing JSON Patch `remove` operations all use `del`. Unlike `with_entries(select(.key != "password"))`, `del` is concise and communicates intent directly.

---

### Example 67: `indices`, `index`, `rindex`

`indices(val)` returns all indices where `val` occurs in a string or array. `index(val)`
returns the first occurrence; `rindex(val)` returns the last.

```bash
echo '"abcabcabc"' | jq 'indices("bc")'
# => indices finds all positions where "bc" appears in the string
# => "bc" appears at byte offsets 1, 4, 7
# => Output: [1, 4, 7]

echo '[1, 2, 3, 2, 1]' | jq 'index(2)'
# => index returns the first position where 2 appears
# => 2 appears at indices 1 and 3; first is 1
# => Output: 1

echo '[1, 2, 3, 2, 1]' | jq 'rindex(2)'
# => rindex returns the LAST position where 2 appears
# => Output: 3
```

**Key takeaway:** `indices` finds all occurrences, `index` finds the first, `rindex` finds the last — they locate values by position in strings and arrays.

**Why it matters:** Parsing protocols that use delimiters (splitting a URL at the last `/`, finding all occurrences of a keyword in a string field) requires position-aware search. These functions enable position-based string slicing without regex, which is both faster and more readable for simple delimiter-based splitting.

---

## Format Strings and Output Formats

### Example 68: `@base64` and `@base64d`

`@base64` encodes a string as base64. `@base64d` decodes a base64-encoded string back
to the original. Both work inside string interpolation.

```bash
echo '"Hello, World!"' | jq '@base64'
# => @base64 encodes the string in standard base64
# => Output: "SGVsbG8sIFdvcmxkIQ=="

echo '"SGVsbG8sIFdvcmxkIQ=="' | jq '@base64d'
# => @base64d decodes a base64 string
# => Output: "Hello, World!"
```

**Key takeaway:** `@base64` encodes strings to base64; `@base64d` decodes them — both are format filters usable in string interpolation for HTTP authentication headers and binary data handling.

**Why it matters:** HTTP Basic Authentication requires base64-encoded credentials in the `Authorization` header. Kubernetes secrets store values as base64. `@base64` in jq lets you encode credentials directly in a shell script: `jq -rn '"user:pass" | @base64'` produces the correct header value without requiring the `base64` CLI tool.

---

### Example 69: `@csv` and `@tsv`

`@csv` converts an array of values to a CSV-formatted string (with proper quoting for
strings containing commas). `@tsv` converts to tab-separated format.

```bash
echo '[["Name","Age","City"],["Alice",30,"Jakarta"],["Bob",25,"Surabaya"]]' \
  | jq -r '.[] | @csv'
# => .[] streams each sub-array
# => @csv converts each array to a properly quoted CSV line
# => String values are quoted; numbers are unquoted
# => -r removes outer JSON quotes from the string output
# => Output:
# => "Name","Age","City"
# => "Alice",30,"Jakarta"
# => "Bob",25,"Surabaya"
```

**Key takeaway:** `@csv` converts an array to a properly escaped CSV line — combined with `-r` and `.[]`, it transforms a JSON array of arrays into a valid CSV file.

**Why it matters:** Exporting data from JSON APIs to CSV for spreadsheet consumption, database import, or reporting tools is a constant operational task. `@csv` handles the fiddly quoting rules (strings with commas or quotes get escaped correctly) that are easy to get wrong with manual string concatenation.

---

### Example 70: `@html` and `@uri`

`@html` escapes special HTML characters (`<`, `>`, `&`, `'`, `"`) in a string. `@uri`
percent-encodes a string for safe inclusion in URLs.

```bash
echo '"<script>alert(1)</script>"' | jq '@html'
# => @html escapes all HTML special characters
# => < becomes &lt;, > becomes &gt;, & becomes &amp;
# => Output: "&lt;script&gt;alert(1)&lt;/script&gt;"

echo '"hello world & more"' | jq '@uri'
# => @uri percent-encodes characters that are not safe in URL query strings
# => Space becomes %20, & becomes %26
# => Output: "hello%20world%20%26%20more"
```

**Key takeaway:** `@html` escapes HTML special characters; `@uri` percent-encodes strings for URL embedding — both prevent injection and malformed output.

**Why it matters:** Generating HTML from JSON data or constructing URLs with user-provided values requires proper escaping. Using `@html` prevents XSS in templated output; using `@uri` prevents malformed URLs when embedding JSON string values as query parameters. These format filters make escaping a zero-friction operation.

---

### Example 71: `@json` and `@text`

`@json` serializes a value to its compact JSON string representation. `@text` is
equivalent to `tostring`. Both are useful inside string interpolation.

```bash
echo '{"key": "val", "num": 42}' | jq '"Payload: \(. | @json)"'
# => @json converts the input object to its compact JSON string representation
# => \(. | @json) interpolates the JSON string into the outer string
# => Output: "Payload: {\"key\":\"val\",\"num\":42}"

echo '42' | jq '"The answer is \(. | @text)"'
# => @text converts any value to a string (same as tostring)
# => Output: "The answer is 42"
```

**Key takeaway:** `@json` serializes a value to its JSON string form; `@text` converts it to a string — both are useful in string interpolation when you need a JSON document embedded inside a larger string.

**Why it matters:** Embedding a JSON object as a string value inside another JSON document (e.g., storing a serialized payload in a log field, or building a webhook body with an embedded JSON string) requires proper JSON serialization. `@json` handles all escaping automatically and ensures the embedded string is valid JSON.

---

## Environment and Variable Binding

### Example 72: `$ENV` and `env`

`$ENV` is a jq object containing all environment variables as key-value strings. `env`
produces the same object. Use `$ENV.VARNAME` to access a specific variable.

```bash
HOME=/Users/test jq -n '$ENV.HOME'
# => $ENV contains all environment variables as a jq object
# => $ENV.HOME retrieves the HOME environment variable
# => Output: "/Users/test"

HOME=/Users/test USER=alice jq -n 'env | {home: .HOME, user: .USER}'
# => env produces the same object as $ENV
# => Object construction extracts two specific env vars
# => Output: {"home": "/Users/test", "user": "alice"}
```

**Key takeaway:** `$ENV` and `env` expose all environment variables as a jq object — they enable jq scripts to consume configuration from the shell environment without `--arg` injection.

**Why it matters:** CI/CD pipelines configure behavior through environment variables (credentials, environment names, feature flags). `$ENV` lets jq scripts read these directly, making them behave consistently with other shell tools and avoiding the need to pass every variable as an explicit `--arg` argument.

---

### Example 73: Variable Binding with `as`

`expr as $var | body` binds the output of `expr` to `$var` for use in `body`. Variables
in jq are immutable and scoped to the body expression.

```bash
echo '{"items": [1, 2, 3], "multiplier": 10}' \
  | jq '.multiplier as $m | .items | map(. * $m)'
# => .multiplier as $m binds the value 10 to $m
# => .items accesses the array [1, 2, 3]
# => map(. * $m) multiplies each element by $m (10)
# => $m is accessible inside map because it is bound in the outer scope
# => Output: [10, 20, 30]
```

**Key takeaway:** `expr as $var | body` captures a value for use in a later expression — the way to pass a computed value across a pipe boundary where `.` changes.

**Why it matters:** Once you pipe through `.items`, `.` changes to the array and `.multiplier` is no longer accessible. Variable binding with `as` captures values before the pipe changes context. This is the fundamental mechanism for writing expressions that reference multiple parts of the input document simultaneously.

---

### Example 74: Pattern Matching with `as`

The `as` operator supports destructuring patterns for arrays and objects, allowing
multiple values to be bound simultaneously.

```bash
echo '[[1,2],[3,4],[5,6]]' | jq '.[] | . as [$a, $b] | {sum: ($a + $b), diff: ($a - $b)}'
# => .[] streams each pair: [1,2], [3,4], [5,6]
# => . as [$a, $b] destructures each pair: $a=first element, $b=second element
# => The body constructs an object using both bound variables
# => For [1,2]: {sum: 3, diff: -1}
# => For [3,4]: {sum: 7, diff: -1}
# => For [5,6]: {sum: 11, diff: -1}
# => Output (3 separate objects):
# => {"sum":3,"diff":-1}
# => {"sum":7,"diff":-1}
# => {"sum":11,"diff":-1}
```

**Key takeaway:** `as [$a, $b]` and `as {key: $var}` destructure arrays and objects into named variables — enabling clean multi-value extraction without multiple separate expressions.

**Why it matters:** Destructuring makes working with fixed-structure arrays (coordinate pairs, RGB tuples, key-value pairs) ergonomic. Instead of `.[0]` and `.[1]` scattered through the expression, named variables `$x` and `$y` make the code self-documenting and less error-prone.

---

## SQL-Style Operations

### Example 75: SQL-Style Cross Join

jq provides `INDEX`, `IN`, `GROUP_IN`, and related functions for SQL-like operations
on arrays of objects. A cross-join can be built by combining two arrays with `limit`.

```bash
echo '{"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}],"orders":[{"uid":1,"item":"book"},{"uid":2,"item":"pen"},{"uid":1,"item":"desk"}]}' \
  | jq '.users as $users | .orders | map(. as $o | {order: $o, user: ($users[] | select(.id == $o.uid))})'
# => .users as $users captures the users array in a variable
# => .orders enters the orders array as the current context
# => map processes each order
# =>   . as $o captures the current order
# =>   $users[] streams all users
# =>   select(.id == $o.uid) keeps the user whose id matches the order's uid
# =>   {order: $o, user: ...} combines the order and matching user
# => Output: three objects joining each order with its user
```

**Key takeaway:** SQL-style joins in jq use variable binding to hold one array and `select` to match against it — it is a nested loop join, efficient for small arrays.

**Why it matters:** Denormalizing API responses that come as separate arrays (users and orders, services and deployments, repos and PRs) into joined records is a constant scripting task. The jq join pattern eliminates the need for intermediate Python scripts when processing moderately sized JSON datasets in shell pipelines.

---

### Example 76: `INDEX` Function

`INDEX(stream; f)` builds a lookup object from a stream, keyed by the value of `f` for
each element. The result is an object that enables O(1) key lookup.

```bash
echo '[{"id":"a1","name":"Alice"},{"id":"b2","name":"Bob"},{"id":"c3","name":"Carol"}]' \
  | jq 'INDEX(.[]; .id)'
# => INDEX iterates the stream (.[]) and creates a lookup object
# => Each element's .id becomes the key; the full element becomes the value
# => This builds a map from id to user object
# => Output: {"a1":{"id":"a1","name":"Alice"},"b2":{"id":"b2","name":"Bob"},"c3":{"id":"c3","name":"Carol"}}
```

**Key takeaway:** `INDEX(stream; f)` builds a lookup map keyed by `f` from a stream — it converts an array into an O(1) lookup object for efficient repeated access.

**Why it matters:** When joining two large arrays, building an index from one array and then looking up in it is an O(N+M) operation versus the O(N\*M) nested loop. For processing thousands of records, `INDEX` makes the difference between a script that takes seconds and one that takes minutes.

---

## Streaming and Advanced Processing

### Example 77: `inputs` for Multiple Documents

`inputs` reads all remaining JSON documents from stdin (after the first, which is `.`).
Combined with `-n`, it reads all documents as a stream without the implicit first read.

```bash
printf '{"id":1}\n{"id":2}\n{"id":3}\n' | jq -n '[inputs]'
# => -n tells jq not to consume any input implicitly (. is null)
# => inputs reads ALL stdin documents as a stream
# => [inputs] collects the stream into a single array
# => Output: [{"id":1},{"id":2},{"id":3}]

printf '{"val":10}\n{"val":20}\n{"val":30}\n' \
  | jq -n 'reduce inputs as $x (0; . + $x.val)'
# => reduce inputs processes each document as $x
# => Accumulates the sum of all .val fields
# => Output: 60
```

**Key takeaway:** `inputs` (with `-n`) reads all stdin documents as a stream — the correct way to process NDJSON (newline-delimited JSON) without `-s` buffering.

**Why it matters:** `-s` (slurp) reads all input into memory before processing, which fails on large log files. `inputs` is a streaming alternative that processes records one at a time while still allowing aggregation via `reduce`. For processing gigabytes of NDJSON logs, `inputs` with `reduce` is both memory-efficient and correct.

---

### Example 78: `debug` for Inspection

`debug` emits its input to stderr as a debug message and also passes the input through
unchanged to stdout. This enables non-destructive inspection at any pipeline point.

```bash
echo '{"name":"Uma","score":85}' | jq '.score | debug | . * 2'
# => .score extracts 85
# => debug prints "DEBUG: 85" to stderr (does not affect the pipeline)
# => . * 2 receives 85 unchanged and computes 170
# => stdout: 170
# => stderr: ["DEBUG:",85]

echo '{"items":[1,2,3]}' | jq '.items | debug("items array") | map(. * 10)'
# => debug("label") emits a labeled debug message to stderr
# => stderr: ["DEBUG:","items array",[1,2,3]]
# => stdout: [10, 20, 30]
```

**Key takeaway:** `debug` is a non-destructive inspection tool — it logs to stderr and passes its input through unchanged, letting you inspect pipeline state without breaking it.

**Why it matters:** Debugging complex multi-stage jq pipelines is hard because you cannot "add a print statement" without changing the output. `debug` solves this by routing diagnostic output to stderr, keeping stdout clean for downstream processing. This is invaluable when building and testing pipelines incrementally.

---

### Example 79: `builtins` Function

`builtins` returns an array of all built-in function names available in the current jq
version, each as a string in the form `"name/arity"`.

```bash
jq -n 'builtins | length'
# => builtins returns the array of all built-in function names
# => length counts them
# => Output: (varies by jq version, typically 170+)

jq -n '[builtins[] | select(startswith("to"))] | sort'
# => Filter builtins to only those starting with "to"
# => Sort alphabetically
# => Output: ["todate","todateiso8601","tojson","tonumber","tostream","tostring"]
```

**Key takeaway:** `builtins` lists all available built-in functions — use it to discover what jq provides and to write version-aware scripts.

**Why it matters:** jq adds new built-ins across versions. Checking `builtins | any(. == "modulemeta/0")` lets scripts detect whether a feature is available and fall back gracefully. Developers also use `builtins` for exploration when learning new jq features or debugging why a function call fails.

---

### Example 80: Streaming Parser with `tostream` and `fromstream`

`tostream` converts a JSON value to a streaming representation (path-value pairs).
`fromstream` reconstructs a value from a stream. This enables memory-efficient processing.

```bash
echo '{"a":1,"b":{"c":2,"d":3}}' | jq '[tostream]'
# => tostream emits path-value pairs for every node in the document
# => Each pair is [path_array, value] for leaf nodes
# => Container open/close markers use truncated paths
# => Output (each emitted value on one line when collected):
# => [["a"],1]
# => [["b","c"],2]
# => [["b","d"],3]
# => [["b"],{"c":2,"d":3}]  <- truncate marker

echo '{"a":1,"b":{"c":2,"d":3}}' \
  | jq 'fromstream(tostream | select(length == 2 and .[0][-1] != "d"))'
# => tostream generates the stream of path-value pairs
# => select keeps only leaf nodes (length==2) where the last path component is not "d"
# => fromstream reconstructs the document from the filtered stream
# => Output: {"a": 1, "b": {"c": 2}}
```

**Key takeaway:** `tostream` decomposes a JSON document into a stream of path-value pairs; `fromstream` reconstructs a document from such a stream — together they enable streaming transformation of large documents.

**Why it matters:** For very large JSON documents (multi-GB), loading the entire document into memory is not feasible. The streaming API processes documents as a sequence of path-value events (similar to SAX parsing), enabling transformations on documents of arbitrary size. This is essential for processing large exports and data dumps.

---

## Real-World Processing Patterns

### Example 81: GitHub API Response Processing

Processing a GitHub API response to extract pull request data into a structured report.

```mermaid
graph LR
    A["GitHub API JSON"]:::blue -->|".[]"| B["Each PR Object"]:::orange
    B -->|"select"| C["Open PRs Only"]:::teal
    C -->|"Object Construction"| D["Report Objects"]:::purple
    D -->|"sort_by"| E["Sorted Report"]:::brown

    classDef blue fill:#0173B2,stroke:#000,color:#fff,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000,color:#fff,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000,color:#fff,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000,color:#fff,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000,color:#fff,stroke-width:2px
```

```bash
echo '[
  {"number":101,"title":"Fix login bug","state":"open","user":{"login":"alice"},"labels":[{"name":"bug"}],"created_at":"2026-03-15T10:00:00Z"},
  {"number":102,"title":"Add dark mode","state":"closed","user":{"login":"bob"},"labels":[{"name":"feature"}],"created_at":"2026-03-20T08:00:00Z"},
  {"number":103,"title":"Update deps","state":"open","user":{"login":"carol"},"labels":[{"name":"maintenance"}],"created_at":"2026-03-25T12:00:00Z"}
]' | jq '[
  .[] |
  select(.state == "open") |
  {
    pr: .number,
    title: .title,
    author: .user.login,
    labels: [.labels[].name],
    opened: .created_at
  }
] | sort_by(.pr)'
# => .[] streams each pull request object
# => select(.state == "open") keeps only open PRs (101, 103)
# => Object construction reshapes each PR into a compact report format
# =>   .number => pr field
# =>   .user.login => author field (nested access)
# =>   [.labels[].name] => collects all label names into an array
# => sort_by(.pr) sorts the results by PR number
# => Output: two objects with pr, title, author, labels, opened fields
```

**Key takeaway:** Real GitHub API processing combines `select`, nested field access, array construction from nested `.[]`, and `sort_by` — all the intermediate techniques applied to a realistic JSON structure.

**Why it matters:** GitHub API responses are deeply nested with arrays of objects inside objects. The pattern of `[.[] | select(...) | {reshaped}]` is the canonical way to filter and restructure API responses for dashboards, reports, and downstream tooling without writing any Python or JavaScript.

---

### Example 82: npm Registry Response Processing

Processing npm registry data to extract dependency information and version statistics.

```bash
echo '{
  "name": "myapp",
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "^4.17.21",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "typescript": "^5.1.3"
  }
}' | jq '
  def parse_version: ltrimstr("^") | ltrimstr("~") | split(".") | {major: .[0], minor: .[1], patch: .[2]};
  {
    name: .name,
    runtime_deps: (.dependencies | to_entries | map({name: .key, version: .value, parsed: (.value | parse_version)})),
    dev_dep_count: (.devDependencies | length),
    all_dep_names: ((.dependencies // {}) + (.devDependencies // {})) | keys
  }'
# => def parse_version: defines a reusable function to parse semver strings
# =>   ltrimstr("^") removes the caret range prefix
# =>   ltrimstr("~") removes the tilde range prefix
# =>   split(".") splits "4.18.2" into ["4","18","2"]
# =>   Constructs an object with major, minor, patch fields
# => .dependencies | to_entries converts {name: version} to [{key:name, value:version}]
# => map({name:.key, version:.value, parsed:...}) shapes each dep with parsed version
# => (.devDependencies // {}) uses alternative for safety if field is missing
# => + merges runtime and dev dep objects; keys extracts all names sorted
# => Output: structured object with runtime_deps array, dev_dep_count, all_dep_names
```

**Key takeaway:** Complex real-world processing combines `def` for reusable logic, `to_entries` for object iteration, `//` for safe defaults, and object construction for reshaping — the full intermediate toolkit in one expression.

**Why it matters:** Analyzing `package.json` files, auditing dependencies, and generating dependency reports are common CI tasks. jq handles `package.json` processing entirely in the shell without requiring Node.js or Python scripts, making it a powerful tool for repository automation.

---

### Example 83: Log File JSON Processing

Processing structured JSON log lines to aggregate error counts by service and severity.

```bash
printf '{"ts":"2026-04-01T10:00:00Z","service":"auth","level":"ERROR","msg":"token expired"}\n{"ts":"2026-04-01T10:01:00Z","service":"api","level":"INFO","msg":"request ok"}\n{"ts":"2026-04-01T10:02:00Z","service":"auth","level":"ERROR","msg":"invalid key"}\n{"ts":"2026-04-01T10:03:00Z","service":"db","level":"WARN","msg":"slow query"}\n{"ts":"2026-04-01T10:04:00Z","service":"auth","level":"INFO","msg":"login ok"}\n' \
  | jq -n '
    [inputs] |
    group_by(.service) |
    map({
      service: .[0].service,
      total: length,
      errors: [.[] | select(.level == "ERROR")] | length,
      levels: (group_by(.level) | map({(.[0].level): length}) | add)
    }) |
    sort_by(.errors) | reverse'
# => -n with inputs reads all NDJSON lines into an array via [inputs]
# => group_by(.service) groups log entries by service name
# => map processes each service group:
# =>   .[0].service gets the service name from the first entry in the group
# =>   length counts total entries in the group
# =>   [.[] | select(.level=="ERROR")] | length counts ERROR entries
# =>   group_by(.level) | map({(.[0].level): length}) | add builds a level summary map
# => sort_by(.errors) | reverse orders by most errors first
# => Output: array of service objects with error statistics, highest error count first
```

**Key takeaway:** Log analysis combines `inputs` for streaming NDJSON, `group_by` for aggregation, nested `select` for filtering within groups, and dynamic object construction for summary statistics — a complete analytics pipeline in one jq expression.

**Why it matters:** Structured JSON logging is the modern standard for application logging. Being able to analyze logs directly with jq in a CI pipeline (detect error rate spikes, identify failing services, generate reports) without loading them into a database or log management system provides immediate operational value.

---

### Example 84: Configuration File Transformation

Transforming a Docker Compose-style JSON configuration between formats, adding computed
fields and restructuring for a different deployment target.

```bash
echo '{
  "version": "3.8",
  "services": {
    "web": {"image": "nginx:1.25", "ports": ["80:80"], "environment": {"ENV": "prod"}},
    "api": {"image": "myapp:2.1", "ports": ["8080:8080"], "environment": {"ENV": "prod", "DB_URL": "postgres://db:5432/app"}},
    "db": {"image": "postgres:15", "ports": ["5432:5432"], "environment": {"POSTGRES_DB": "app"}}
  }
}' | jq '
  .services |
  to_entries |
  map({
    name: .key,
    image: .value.image,
    image_name: (.value.image | split(":")[0]),
    image_tag: (.value.image | split(":")[1] // "latest"),
    port_mappings: (.value.ports // [] | map(split(":") | {host: .[0], container: .[1]})),
    env_count: (.value.environment // {} | length)
  }) |
  sort_by(.name)'
# => .services enters the services object
# => to_entries converts {name: config} into [{key: name, value: config}] pairs
# => map reshapes each entry:
# =>   .key becomes the service name
# =>   .value.image is the full image reference
# =>   split(":")[0] extracts just the image name (before colon)
# =>   split(":")[1] // "latest" extracts the tag or defaults to "latest"
# =>   .value.ports // [] provides a safe default for missing ports
# =>   map(split(":") | {host, container}) parses "80:80" into structured objects
# =>   .value.environment // {} | length counts env vars safely
# => sort_by(.name) orders services alphabetically
# => Output: array of structured service objects with computed fields
```

**Key takeaway:** Configuration transformation combines `to_entries` for object iteration, `split` for string parsing, `//` for safe defaults, and nested object construction to produce a richly structured output from a flat config.

**Why it matters:** Transforming configuration between formats (Docker Compose to Kubernetes manifests, Terraform to Ansible, one CI format to another) is a core DevOps automation task. jq handles these transformations without requiring Python scripts or custom tooling, making them reproducible and inspectable in shell pipelines.

---

### Example 85: Complex Multi-Source Data Pipeline

A complete data pipeline combining multiple jq techniques: loading data with `--argjson`,
cross-referencing arrays, computing statistics, and producing a structured report.

```bash
echo '[
  {"id":1,"name":"Alice","dept_id":10,"salary":85000},
  {"id":2,"name":"Bob","dept_id":20,"salary":72000},
  {"id":3,"name":"Carol","dept_id":10,"salary":91000},
  {"id":4,"name":"Dave","dept_id":30,"salary":68000},
  {"id":5,"name":"Eve","dept_id":20,"salary":95000}
]' | jq --argjson depts '[{"id":10,"name":"Engineering"},{"id":20,"name":"Marketing"},{"id":30,"name":"Operations"}]' '
  ($depts | INDEX(.[]; .id)) as $dept_map |
  group_by(.dept_id) |
  map(
    . as $group |
    ($group[0].dept_id) as $did |
    {
      department: $dept_map[$did | tostring].name,
      headcount: ($group | length),
      avg_salary: ($group | map(.salary) | add / length | floor),
      max_salary: ($group | max_by(.salary).salary),
      employees: ($group | map(.name) | sort)
    }
  ) |
  sort_by(.avg_salary) | reverse'
# => --argjson depts injects the departments JSON array as $depts
# => ($depts | INDEX(.[]; .id)) as $dept_map builds a lookup keyed by dept id
# =>   Note: id is a number but INDEX creates string keys via tostring in lookup
# => group_by(.dept_id) groups employees by their department id
# => map processes each department group:
# =>   . as $group captures the current group for multiple references
# =>   ($group[0].dept_id) as $did captures the department id
# =>   department: looks up the name from $dept_map using $did | tostring
# =>   headcount: counts employees in the group
# =>   avg_salary: sums all salaries, divides by count, floors to integer
# =>   max_salary: finds the highest salary in the group
# =>   employees: extracts names and sorts them alphabetically
# => sort_by(.avg_salary) | reverse orders by average salary descending
# => Output: department report with headcount, avg/max salary, and employee list
```

**Key takeaway:** Production data pipelines combine `--argjson` for multi-source input, `INDEX` for efficient lookups, `group_by` for aggregation, variable binding for multi-reference data, and statistical computations — all the advanced features working together.

**Why it matters:** Real operational pipelines join data from multiple sources (database exports, API responses, configuration files), aggregate statistics, and produce structured reports. This pattern — injecting reference data with `--argjson`, building a lookup index, grouping the main data, and computing per-group statistics — is the template for countless DevOps, data engineering, and reporting tasks that jq handles without any runtime dependencies.

---
