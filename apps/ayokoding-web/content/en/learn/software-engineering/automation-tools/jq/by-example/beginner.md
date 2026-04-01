---
title: "Beginner"
weight: 10000001
date: 2026-04-01T00:00:00+07:00
draft: false
description: "Beginner jq examples covering identity filter, field access, array indexing, pipes, basic types, object/array construction, and simple transformations"
tags: ["jq", "json", "data-processing", "tutorial", "by-example", "code-first", "beginner"]
---

This tutorial covers foundational jq concepts through 28 self-contained, heavily annotated
shell examples. Every command uses `echo '...' | jq '...'` so you can run each one directly
in your terminal. The examples progress from the identity filter through field access, array
indexing, pipes, type inspection, object and array construction, iteration, and command-line
flags — spanning 0–35% of jq features.

## Identity and Basic Filters

### Example 1: Identity Filter

The identity filter `.` passes its input through unchanged. It is the simplest valid jq
program and the foundation every other filter builds on.

```bash
echo '{"name": "Alice", "age": 30}' | jq '.'
# => jq receives the JSON object as input
# => . returns the input unchanged
# => Output (pretty-printed by default):
# => {
# =>   "name": "Alice",
# =>   "age": 30
# => }
```

**Key takeaway:** `.` is the identity filter — it returns input unchanged and is the starting point for building any jq pipeline.

**Why it matters:** Even though `.` does nothing, it is essential for pretty-printing raw JSON from APIs or log files. Piping curl output to `jq '.'` instantly formats dense single-line JSON into readable indented output, which is one of the most common daily uses of jq in engineering workflows.

---

### Example 2: Field Access with `.foo`

The `.foo` filter extracts the value of the key `foo` from the input object. If the key
does not exist, jq returns `null` rather than an error.

```bash
echo '{"name": "Alice", "age": 30}' | jq '.name'
# => Input is an object with keys "name" and "age"
# => .name selects the value associated with key "name"
# => Output: "Alice"
# => Note: output is a JSON string (includes quotes in raw output)
```

**Key takeaway:** `.foo` extracts a single field from an object — the most frequent operation when working with API responses.

**Why it matters:** Almost every JSON processing task starts with extracting a specific field. Knowing that jq returns `null` (not an error) for missing keys lets you write defensive pipelines that continue even when optional fields are absent, a critical property for processing heterogeneous API responses.

---

### Example 3: Nested Field Access with `.foo.bar`

Chaining dot-notation descends into nested objects. `.foo.bar` is shorthand for
`.foo | .bar` — get `foo`, then get `bar` from that result.

```bash
echo '{"user": {"name": "Alice", "role": "admin"}}' | jq '.user.name'
# => Input has a top-level key "user" whose value is a nested object
# => .user navigates into the nested object => {"name": "Alice", "role": "admin"}
# => .name then selects from that nested object
# => Output: "Alice"
```

**Key takeaway:** Dot-chaining like `.a.b.c` descends through nested object levels without needing explicit pipes between each step.

**Why it matters:** Real-world JSON responses from REST APIs and GraphQL endpoints are deeply nested. A GitHub API response wraps commit data three or four levels deep. Dot-chaining lets you extract `.repository.defaultBranchRef.target.oid` in one readable expression rather than writing separate `select` or pipe chains.

---

### Example 4: Array Index with `.[N]`

`.[0]` accesses the first element of an array; `.[N]` accesses the element at index N
(zero-based). Negative indices count from the end: `.[-1]` is the last element.

```bash
echo '[10, 20, 30, 40, 50]' | jq '.[2]'
# => Input is a JSON array with five elements
# => .[2] selects the element at zero-based index 2
# => Output: 30

echo '[10, 20, 30, 40, 50]' | jq '.[-1]'
# => .[-1] selects the last element (index 4 from the front)
# => Output: 50
```

**Key takeaway:** `.[N]` accesses array elements by zero-based index; negative indices count backward from the end.

**Why it matters:** Log streams and API paginated responses return arrays of events where you frequently need the first or last item — the most recent log entry, the latest deployment, or the oldest open issue. Negative indexing eliminates the need to know the array length before accessing the last element.

---

### Example 5: Array Slice with `.[M:N]`

`.[M:N]` returns a sub-array from index M (inclusive) to N (exclusive). Omitting either
bound defaults to the start or end of the array respectively.

```bash
echo '[10, 20, 30, 40, 50]' | jq '.[1:4]'
# => .[1:4] extracts elements at indices 1, 2, and 3 (not 4)
# => Output: [20, 30, 40]

echo '[10, 20, 30, 40, 50]' | jq '.[2:]'
# => .[2:] extracts from index 2 to the end
# => Output: [30, 40, 50]
```

**Key takeaway:** `.[M:N]` slices arrays just like Python list slicing — upper bound is exclusive and omitting a bound means start or end.

**Why it matters:** Pagination and sliding-window operations on JSON arrays are common in data pipelines. Slicing lets you take the first N results from an API response or skip a header row in an array-of-arrays CSV representation, all without writing loop logic.

---

## Pipe Operator and Multiple Outputs

### Example 6: Pipe Operator `|`

The `|` operator chains filters: the output of the left filter becomes the input of the
right filter. This is the central composition mechanism in jq.

```bash
echo '{"user": {"name": "Bob", "score": 42}}' | jq '.user | .name'
# => .user extracts the nested object => {"name": "Bob", "score": 42}
# => | passes that object as input to the next filter
# => .name extracts "name" from the piped object
# => Output: "Bob"
```

**Key takeaway:** `|` composes filters so complex transformations become a linear sequence of simple steps, each operating on the output of the previous one.

**Why it matters:** Every non-trivial jq program uses pipes. The mental model mirrors Unix pipes: small focused tools chained together. This composability means you can build and test each stage of a transformation independently before combining them, which dramatically reduces debugging time on complex JSON reshaping tasks.

---

### Example 7: Comma Operator for Multiple Outputs

The `,` operator runs two filters on the same input and produces multiple outputs — one
per filter. Each output appears on its own line.

```bash
echo '{"name": "Carol", "age": 25, "city": "Jakarta"}' | jq '.name, .age'
# => Both .name and .age receive the same input object
# => .name produces: "Carol"
# => .age produces: 25
# => Output (two separate JSON values):
# => "Carol"
# => 25
```

**Key takeaway:** `,` generates multiple outputs from one input — each expression runs independently against the same input and contributes one value to the output stream.

**Why it matters:** Extracting multiple fields in a single pass is far more efficient than running jq twice. When scripting with jq output, you can capture multiple values in one invocation with `read a b < <(jq -r '.name, .age' <<< "$json")`, reducing subshell overhead in tight loops.

---

### Example 8: Object Construction with `{}`

`{key: expr}` builds a new JSON object. Keys can be literals or expressions; values are
any jq filter evaluated against the current input.

```bash
echo '{"name": "Dave", "age": 40, "country": "ID"}' | jq '{username: .name, years: .age}'
# => Input object has three fields
# => {} constructs a new object with renamed keys
# => username: .name => username key gets value of .name => "Dave"
# => years: .age => years key gets value of .age => 40
# => country is intentionally excluded — only listed fields appear
# => Output: {"username": "Dave", "years": 40}
```

**Key takeaway:** `{key: filter}` constructs new objects with renamed or restructured fields — the primary way to reshape JSON for downstream consumers.

**Why it matters:** API consumers rarely need all fields in a response. Constructing a narrower object reduces payload size, removes sensitive fields before logging, and creates clean data contracts between microservices. This is one of the highest-value jq operations in production data pipelines.

---

### Example 9: Array Construction with `[]`

`[expr]` wraps filter output in an array. Because `expr` can produce multiple values
(from `,` or `.[]`), this collects all outputs into a single JSON array.

```bash
echo '{"a": 1, "b": 2, "c": 3}' | jq '[.a, .b, .c]'
# => [expr] collects all outputs of the inner expression into an array
# => .a, .b, .c produces three separate values: 1, 2, 3
# => The outer [] gathers them into a single JSON array
# => Output: [1, 2, 3]
```

**Key takeaway:** `[expr]` collects the output stream of any expression into a JSON array — the standard way to produce an array from multiple filter outputs.

**Why it matters:** Many shell tools and downstream APIs expect arrays rather than newline-separated JSON values. Wrapping outputs in `[]` bridges the gap between jq's multi-value output model and consumers that require a single array document, such as REST API bodies or JSON files written to disk.

---

### Example 10: String Interpolation with `\(expr)`

Inside a jq string literal, `\(expr)` evaluates `expr` and interpolates the result as a
string. This creates formatted strings by combining literal text with extracted values.

```bash
echo '{"name": "Eve", "score": 98}' | jq '"Player \(.name) scored \(.score) points"'
# => The outer quotes define a jq string literal (not just a filter)
# => \(.name) evaluates .name => "Eve" and interpolates it
# => \(.score) evaluates .score => 98 and interpolates it (number becomes string)
# => Output: "Player Eve scored 98 points"
```

**Key takeaway:** `\(expr)` inside jq string literals performs string interpolation — any filter result gets converted to its string representation and embedded in the output.

**Why it matters:** Generating human-readable messages, log lines, and formatted reports from JSON data is a daily scripting task. String interpolation avoids clunky `sed`/`awk` post-processing by letting jq produce the final formatted string in a single expression, keeping the pipeline simple and readable.

---

## Type System and Introspection

### Example 11: The `type` Function

`type` returns a string describing the JSON type of its input: `"null"`, `"boolean"`,
`"number"`, `"string"`, `"array"`, or `"object"`.

```bash
echo '42' | jq 'type'
# => Input is a JSON number
# => type inspects the input and returns its type name
# => Output: "number"

echo '"hello"' | jq 'type'
# => Input is a JSON string
# => Output: "string"

echo '{"x": 1}' | jq 'type'
# => Input is a JSON object
# => Output: "object"
```

**Key takeaway:** `type` returns a string naming the JSON type of the current value — essential for writing type-safe conditional filters.

**Why it matters:** Real-world JSON data is often inconsistent: a field that should be an array sometimes arrives as `null`, a number sometimes arrives as a string. Checking `type` before processing prevents cryptic errors like "null is not iterable" and lets you write defensive filters that handle multiple input shapes gracefully.

---

### Example 12: Null Handling

`null` is a valid JSON value in jq. Many operations on `null` return `null` rather than
erroring, making pipelines resilient to missing fields.

```bash
echo '{"name": "Frank"}' | jq '.age'
# => .age requests a key that does not exist in the object
# => jq returns null rather than raising an error
# => Output: null

echo 'null' | jq '.foo'
# => Accessing a field on null also returns null (not an error)
# => Output: null
```

**Key takeaway:** jq returns `null` for missing object keys and for field access on `null` inputs — the pipeline continues rather than crashing on absent fields.

**Why it matters:** Defensive pipelines that tolerate missing fields are essential when consuming third-party API responses where optional fields may be absent. Knowing that `.missing_field` returns `null` (not an error) means you can write `select(.field != null)` to filter only records that have the field, rather than guarding every access with try-catch.

---

### Example 13: `length` Function

`length` returns the number of elements in an array, the number of keys in an object,
the byte count of a string, or `0` for `null`.

```bash
echo '[1, 2, 3, 4, 5]' | jq 'length'
# => Input is a JSON array with 5 elements
# => length counts the elements
# => Output: 5

echo '{"a": 1, "b": 2}' | jq 'length'
# => Input is a JSON object with 2 keys
# => length counts the keys
# => Output: 2

echo '"hello"' | jq 'length'
# => Input is a string with 5 characters
# => length returns the byte count (UTF-8 aware)
# => Output: 5
```

**Key takeaway:** `length` is polymorphic — it counts array elements, object keys, or string bytes depending on input type.

**Why it matters:** Validating response sizes, checking for empty arrays, and guarding against processing empty objects are ubiquitous tasks. A single `length` call replaces type-specific counting logic and works uniformly across all JSON container types.

---

### Example 14: `keys` and `values`

`keys` returns the sorted array of an object's keys. `values` returns an array of its
values in key-sorted order.

```bash
echo '{"z": 3, "a": 1, "m": 2}' | jq 'keys'
# => keys extracts all key names from the object
# => keys SORTS them alphabetically
# => Output: ["a", "m", "z"]

echo '{"z": 3, "a": 1, "m": 2}' | jq 'values'
# => values extracts all values, in the same sorted-key order
# => Output: [1, 2, 3]
```

**Key takeaway:** `keys` returns sorted object keys; `values` returns their corresponding values in the same sorted order.

**Why it matters:** Iterating over object properties is necessary when the JSON schema is dynamic — when processing configuration maps where keys are user-defined. `keys` gives you the property list to iterate over with `map` or `foreach`, and sorting ensures deterministic output regardless of insertion order.

---

### Example 15: `keys_unsorted`

`keys_unsorted` returns object keys in their original insertion order rather than
alphabetically sorted. Use it when order matters for downstream processing.

```bash
echo '{"z": 3, "a": 1, "m": 2}' | jq 'keys_unsorted'
# => keys_unsorted preserves the JSON object key order (z, a, m)
# => No alphabetical sorting is applied
# => Output: ["z", "a", "m"]
```

**Key takeaway:** `keys_unsorted` preserves original key ordering while `keys` always sorts — choose based on whether insertion order carries semantic meaning.

**Why it matters:** Some JSON formats use key ordering to convey priority or processing order (AWS CloudFormation templates, certain configuration formats). Using `keys` on these documents silently reorders properties and may break tooling that depends on ordering. `keys_unsorted` is the safe default when you are unsure.

---

## Object and Array Utilities

### Example 16: `has` Function

`has(key)` returns `true` if the input object has the given key (even if the value is
`null`), and `false` otherwise.

```bash
echo '{"name": "Grace", "age": null}' | jq 'has("age")'
# => has checks for key EXISTENCE, not value truthiness
# => "age" exists in the object (its value is null but the key is present)
# => Output: true

echo '{"name": "Grace"}' | jq 'has("age")'
# => "age" key is entirely absent from the object
# => Output: false
```

**Key takeaway:** `has(key)` tests for key existence regardless of value — `has("x")` is true even when `.x` is `null`.

**Why it matters:** Distinguishing between a field that is missing and a field that is explicitly set to `null` is critical in patch APIs (PATCH vs PUT semantics) and in schema validation. `has` gives you the existence check while `.field == null` gives you the value check — these are different and knowing the distinction prevents subtle processing bugs.

---

### Example 17: `in` Operator

`in` tests whether a value exists as a key in an object or as an index in an array.
It is the reverse argument order of `has`.

```bash
echo '{"name": "Hana", "city": "Surabaya"}' | jq '"name" | in({"name": "Hana", "city": "Surabaya"})'
# => "in" tests if the left value is a key in the right object
# => "name" is a key in the object => true
# => Output: true

echo '[1,2,3]' | jq '2 | in([1,2,3])'
# => For arrays, "in" tests if the number is a valid index (0-based)
# => Index 2 exists in a 3-element array => true
# => Output: true
```

**Key takeaway:** `x | in(obj)` tests if `x` is a key (for objects) or a valid index (for arrays) in `obj` — it is the argument-reversed form of `has`.

**Why it matters:** `in` is useful inside `map` and `select` pipelines where you need to check membership relative to a lookup structure. Checking whether a field name is in a whitelist of allowed keys or whether an index is within bounds before access prevents runtime errors.

---

### Example 18: `empty` Filter

`empty` produces no output at all. It is useful in conditional expressions to suppress
unwanted outputs from a pipeline.

```bash
echo '5' | jq 'if . > 3 then . else empty end'
# => Input is 5, which is greater than 3
# => The then branch returns . => 5
# => empty would suppress output entirely (no JSON value emitted)
# => Output: 5

echo '2' | jq 'if . > 3 then . else empty end'
# => Input is 2, which is NOT greater than 3
# => The else branch calls empty
# => No output is produced — the value is silently filtered out
# => (no output)
```

**Key takeaway:** `empty` produces zero outputs — it is the jq equivalent of `continue` or a no-op filter that silently discards input.

**Why it matters:** `empty` enables filtering without wrapping everything in `select`. In recursive or conditional pipelines, sometimes you want to suppress a branch entirely rather than return `null`. Returning `null` pollutes downstream arrays; `empty` cleanly omits the value from the output stream.

---

## Array and Object Iteration

### Example 19: `.[]` Array Iteration

`.[]` explodes an array into a stream of its individual elements. Each element becomes a
separate jq output value. This is how you iterate over all array elements.

```bash
echo '[10, 20, 30]' | jq '.[]'
# => .[] iterates over each element of the array
# => Each element becomes a separate output on its own line
# => Output:
# => 10
# => 20
# => 30
```

**Key takeaway:** `.[]` streams array elements as separate outputs — use it whenever you need to process each element individually or feed them into a subsequent filter.

**Why it matters:** Most bulk processing in jq flows through `.[]`. Understanding that `.[]` produces a stream (not an array) is the key insight. Wrapping it in `[.[] | filter]` collects the stream back into an array. This stream model is what makes `map` and `select` possible and is fundamental to writing efficient jq programs.

---

### Example 20: `.[]` Object Iteration

When applied to an object, `.[]` streams all values (not keys). Use `keys[]` or
`to_entries[]` to access keys alongside values.

```bash
echo '{"a": 1, "b": 2, "c": 3}' | jq '.[]'
# => .[] on an object streams all VALUES
# => Order follows key-sorted order
# => Output:
# => 1
# => 2
# => 3
```

**Key takeaway:** `.[]` on an object streams its values in key-sorted order — use `to_entries` if you need both key and value simultaneously.

**Why it matters:** Object value iteration is used when normalizing configuration objects into arrays for uniform processing. For example, a Docker Compose services object maps service names to config objects — `.[]` streams all service configs without needing to know the service names in advance.

---

### Example 21: Optional Field Access with `.foo?`

The `?` suffix suppresses errors. `.foo?` returns the value of `.foo` if it exists but
produces no output (rather than `null` or an error) if the input is not an object.

```bash
echo '[1, 2, 3]' | jq '.foo?'
# => Input is an array, not an object — .foo would normally error
# => .foo? suppresses the error and produces no output
# => (no output)

echo '{"foo": 42}' | jq '.foo?'
# => Input is an object with key "foo"
# => .foo? works identically to .foo when input is an object
# => Output: 42
```

**Key takeaway:** `.foo?` is the error-suppressed version of `.foo` — it silently produces no output on non-object inputs instead of raising a type error.

**Why it matters:** When processing arrays that may contain a mix of objects and primitives, `.foo?` lets you extract a field from objects while silently skipping non-objects. This is cleaner than wrapping every access in `try-catch` and is the idiomatic way to write resilient iteration over heterogeneous arrays.

---

### Example 22: `.[]?` Optional Iteration

`.[]?` suppresses errors from iterating over non-iterable values. It produces no output
when applied to `null` or a non-collection type.

```bash
echo 'null' | jq '.[]?'
# => null is not iterable — .[] would error
# => .[]? suppresses the error and produces no output
# => (no output)

echo '[1, 2, 3]' | jq '.[]?'
# => Array is iterable — .[]? behaves identically to .[]
# => Output:
# => 1
# => 2
# => 3
```

**Key takeaway:** `.[]?` safely iterates any value — it silently produces nothing for non-iterable inputs like `null` instead of raising a type error.

**Why it matters:** API responses frequently return `null` when a list is empty rather than `[]`. Using `.[]?` instead of `.[]` means your pipeline processes empty responses gracefully without needing `if . != null then .[] else empty end` guards everywhere.

---

## Command-Line Flags

### Example 23: Raw Output with `-r`

By default, jq outputs JSON strings with surrounding double-quotes. The `-r` flag
outputs raw strings without quotes, which is necessary when passing values to shell
commands.

```bash
echo '{"name": "Ivan"}' | jq '.name'
# => Default output wraps strings in JSON quotes
# => Output: "Ivan"

echo '{"name": "Ivan"}' | jq -r '.name'
# => -r strips the surrounding quotes from string output
# => Output: Ivan  (no quotes — suitable for shell variable assignment)
```

**Key takeaway:** `-r` (raw output) removes JSON string quotes from output — essential when using jq output as shell arguments or in variable assignments.

**Why it matters:** Almost every shell script that uses jq output in subsequent commands needs `-r`. Without it, you get `"Ivan"` with literal quotes that break file paths, curl headers, and git commands. Forgetting `-r` is the number one source of subtle bugs in jq-based shell scripts.

---

### Example 24: Compact Output with `-c`

By default, jq pretty-prints with newlines and indentation. The `-c` flag produces
compact single-line output — necessary for line-oriented processing of multiple records.

```bash
echo '{"name": "Julia", "age": 28}' | jq -c '.'
# => -c disables pretty-printing
# => Output: {"name":"Julia","age":28}  (single line, no spaces after colon/comma)
```

**Key takeaway:** `-c` produces compact single-line JSON output — use it when writing JSON to line-delimited files or feeding jq output to tools that expect one JSON object per line.

**Why it matters:** NDJSON (Newline Delimited JSON) is the standard format for streaming JSON logs, Elasticsearch bulk APIs, and many data pipeline tools. Without `-c`, jq's pretty-printed multi-line output breaks line-oriented processing. Using `-c` ensures each transformed record occupies exactly one line.

---

### Example 25: Null Input with `-n`

The `-n` flag tells jq not to read any input from stdin. This is used when constructing
JSON from scratch using only jq expressions and no input data.

```bash
jq -n '{"version": "1.0", "timestamp": "2026-04-01"}'
# => -n means jq does not wait for stdin input
# => . inside the filter would be null (no input was read)
# => The literal object expression is returned directly
# => Output:
# => {
# =>   "version": "1.0",
# =>   "timestamp": "2026-04-01"
# => }
```

**Key takeaway:** `-n` runs jq with `null` as the implicit input — use it when you want to construct JSON from scratch without needing a JSON input document.

**Why it matters:** Generating JSON payloads for API calls (curl POST bodies), creating configuration files, and building test fixtures are all tasks where you want to produce JSON without reading any input. `-n` is the correct tool for these cases, much cleaner than `echo '{}' | jq '...'`.

---

### Example 26: Slurp Mode with `-s`

The `-s` flag reads all input lines and combines them into a single JSON array before
applying the filter. Useful when you have multiple JSON objects on separate lines.

```bash
printf '{"id":1}\n{"id":2}\n{"id":3}\n' | jq -s '.'
# => Without -s, jq processes each line separately
# => -s reads ALL input and wraps it in a single array
# => . then receives that array as its input
# => Output:
# => [
# =>   {"id": 1},
# =>   {"id": 2},
# =>   {"id": 3}
# => ]
```

**Key takeaway:** `-s` (slurp) combines multiple JSON inputs into a single array — it bridges the gap between streaming JSON (one object per line) and array-based filters.

**Why it matters:** Log files and streaming APIs emit one JSON object per line (NDJSON). Many jq operations like `group_by`, `sort_by`, and `reduce` require a single array as input. `-s` is the standard way to aggregate a stream of records into a processable array before applying those bulk operations.

---

### Example 27: Raw Input with `-R`

The `-R` flag reads each input line as a raw string rather than parsing it as JSON.
Combined with `-s`, it reads the entire input as a single string.

```bash
printf 'hello\nworld\n' | jq -R '.'
# => -R reads each line as a raw string (not parsed as JSON)
# => Each line becomes a JSON string value
# => Output:
# => "hello"
# => "world"

printf 'line1\nline2\nline3\n' | jq -Rs 'split("\n") | map(select(length > 0))'
# => -R -s reads entire input as one big string
# => split("\n") breaks it into an array of lines
# => map(select(length > 0)) removes the trailing empty string from final newline
# => Output: ["line1", "line2", "line3"]
```

**Key takeaway:** `-R` treats input lines as raw strings instead of JSON — combine with `-s` to read a whole text file into jq as a single string for text processing.

**Why it matters:** Not all input is JSON. CSV files, log lines, and plain text configuration files need to enter jq as strings before being parsed. `-R` is the bridge between plain text and jq's JSON world, enabling text-to-JSON conversion pipelines entirely within jq without intermediate tools.

---

### Example 28: Multiple Input Files

jq accepts multiple file arguments and processes each in sequence. Combined with `--arg`
and `--argjson`, you can pass shell variables into jq expressions safely without shell
injection risks.

```bash
echo '{"name": "Ken"}' | jq --arg greeting "Hello" '"$greeting \(.name)"'
# => --arg name value injects a shell string as a jq variable $name
# => Inside the jq expression, $greeting refers to the injected string "Hello"
# => \(.name) interpolates the .name field from the JSON input
# => Output: "Hello Ken"

echo '{"count": 5}' | jq --argjson threshold 10 '.count < $threshold'
# => --argjson injects a JSON value (not a raw string) as $threshold
# => $threshold is the number 10 (not the string "10")
# => .count < $threshold compares the field value against the injected number
# => Output: true
```

**Key takeaway:** `--arg` injects shell values as jq string variables; `--argjson` injects them as parsed JSON values — both prevent shell injection by keeping values separate from the filter expression.

**Why it matters:** Building jq filters by string concatenation (e.g., `jq ".name == \"$USER\""`) is a shell injection vulnerability. `--arg` and `--argjson` pass values safely as typed variables, just as parameterized queries prevent SQL injection. This is the security-correct way to pass dynamic values into jq expressions in scripts.

---
