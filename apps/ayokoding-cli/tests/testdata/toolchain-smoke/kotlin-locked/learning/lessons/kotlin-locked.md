# Kotlin locked dependencies hello

The unit loads one class from the locked jar and prints a fixed line.

**`learning/code/ex-01-deps/main.kt`**

```kotlin
fun main() {
    Class.forName("com.google.gson.Gson")
    println("kotlin-deps-ok")
}
```

**Output** (`learning/code/ex-01-deps/expected/main.stdout.txt`):

```text
kotlin-deps-ok
```
