# Java repositories hello

The unit lists the locked jars from both repositories in sorted order.

**`learning/code/ex-01-repos/run.yaml`**

```yaml
schema: ayokoding.run/v1
toolchain: java
dependencies:
  lockfile: jars.lock
resources:
  memory: 2g
runs:
  - name: main
    command: [sh, -c, "for f in \"$JARS\"/*; do basename \"$f\"; done | sort"]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

**Output** (`learning/code/ex-01-repos/expected/main.stdout.txt`):

```text
gson-2.13.1.jar
migratus-1.6.8.jar
```
