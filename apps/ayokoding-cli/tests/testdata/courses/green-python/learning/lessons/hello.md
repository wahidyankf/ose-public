# Hello

**`learning/code/ex-01-hello/example.py`**

```python
print("hello")
print("middle")
print("world")
```

**Output** (`learning/code/ex-01-hello/expected/main.stdout.txt`):

```text
hello
middle
world
```

## Fixed environment

**`learning/code/ex-03-env/env.py`**

```python
"""Print the fixed run environment facts (fixture for determinism)."""

import os

print("SECRET_TOKEN=" + os.environ.get("SECRET_TOKEN", "absent"))
print("TZ=" + os.environ.get("TZ", "absent"))
print("SOURCE_DATE_EPOCH=" + os.environ.get("SOURCE_DATE_EPOCH", "absent"))
```

**Output** (`learning/code/ex-03-env/expected/env.stdout.txt`):

```text
SECRET_TOKEN=absent
TZ=UTC
SOURCE_DATE_EPOCH=0
```

## Immutable copy

**`learning/code/ex-04-immutable/sticky.py`**

```python
"""Overwrite its own source, proving runs see a temporary copy (fixture)."""

with open("sticky.py", "w") as handle:
    handle.write("vandalized\n")
print("still here")
```

**Output** (`learning/code/ex-04-immutable/expected/immutable.stdout.txt`):

```text
still here
```
