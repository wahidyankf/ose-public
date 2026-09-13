---
description: "The distinction between realistic test data that verifies parsing logic and actual machine identity."
when_to_use: "Use when a test fixture resembles machine-specific data and you need to confirm it is acceptable."
---

# Acceptable Test Data

Test data that simulates realistic tool or system output is acceptable even when it resembles machine-specific information, provided it tests parsing logic rather than encoding actual machine identity.

**Acceptable examples:**

```go
// Tests the OS/arch parser — uses realistic values, not the real machine
assert.Equal(t, "darwin/arm64", parseOSArch(mockOutput))
```

```python
# Tests hostname parsing logic — the value is synthetic test input
assert parse_hostname("my-dev-machine.test") == "my-dev-machine"
```

The distinction: if a value exists in the test to verify that the code correctly handles a format or string pattern, it is test data. If the value was copied from the developer's machine because it was convenient, it is machine-specific information.
