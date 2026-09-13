---
title: "Java 18"
date: 2026-02-04T00:00:00+07:00
draft: false
description: "Java 18 release highlights - UTF-8 by default, Simple Web Server, Code Snippets in JavaDoc, Pattern Matching for switch second preview, and deprecate finalization"
weight: 1000005
tags: ["java", "java-18", "utf-8", "simple-web-server", "javadoc-snippets", "pattern-matching-switch"]
---

## Release Information

- **Release Date**: March 22, 2022
- **Support Type**: Non-LTS (6-month support)
- **End of Support**: September 2022 (superseded by Java 19)
- **JEPs**: 9 enhancements

## Standard Features

### UTF-8 by Default (JEP 400)

UTF-8 is now the **default character encoding** for Java SE APIs.

**Before (Java 17):**

```java
// Platform-dependent encoding (Windows: windows-1252, Linux: UTF-8)
String defaultCharset = Charset.defaultCharset().name();
Files.readString(Path.of("file.txt")); // Uses platform default
```

**After (Java 18):**

```java
// Always UTF-8 regardless of platform
String defaultCharset = Charset.defaultCharset().name(); // "UTF-8"
Files.readString(Path.of("file.txt")); // Always UTF-8
```

**Impact:**

- **Consistency** across platforms (Windows, macOS, Linux)
- **Fewer encoding bugs** (no more garbled characters from platform mismatch)
- **Breaking change**: Code relying on platform default may behave differently

**Migration:**

```java
// If you need platform-specific encoding
Charset platformCharset = Charset.forName(System.getProperty("native.encoding"));
```

### Simple Web Server (JEP 408)

Command-line HTTP server for prototyping and testing.

**Start server:**

```bash
# Serve current directory on port 8000
jwebserver

# Custom port and directory
jwebserver -p 9000 -d /path/to/files
```

**Access:** <http://localhost:8000>

**Programmatic API:**

```java
import com.sun.net.httpserver.SimpleFileServer;
import java.net.InetSocketAddress;
import java.nio.file.Path;

var server = SimpleFileServer.createFileServer(
    new InetSocketAddress(8080),
    Path.of("/var/www"),
    SimpleFileServer.OutputLevel.VERBOSE
);
server.start();
```

**Use cases:**

- Quick file sharing over local network
- Testing static websites
- Serving files for development
- Educational purposes

**Note**: Not for production use (no security features, single-threaded)

### Code Snippets in Java API Documentation (JEP 413)

`@snippet` tag for better code examples in JavaDoc.

**Before (@code tag):**

```java
/**
 * Example:
 * <pre>{@code
 * List<String> list = new ArrayList<>();
 * list.add("Hello");
 * }</pre>
 */
```

**After (@snippet tag):**

```java
/**
 * Example:
 * {@snippet :
 * List<String> list = new ArrayList<>();  // @highlight
 * list.add("Hello");
 * list.add("World");  // @link substring=add target="List#add"
 * }
 */
```

**Features:**

- **Syntax highlighting** markers
- **Links** to related documentation
- **Region markers** for selective display
- **External files** (load snippets from source files)

**External snippet example:**

```java
/**
 * {@snippet file="examples/HelloWorld.java" region="greeting"}
 */
```

## Preview Features

### Pattern Matching for switch (JEP 420) - **Second Preview**

**Improvements:**

- Better exhaustiveness checking
- Guarded patterns

**Example:**

```java
static String format(Object obj) {
    return switch (obj) {
        case Integer i -> String.format("int %d", i);
        case Long l -> String.format("long %d", l);
        case Double d -> String.format("double %f", d);
        case String s -> String.format("String %s", s);
        default -> obj.toString();
    };
}
```

**Guarded patterns:**

```java
static String classify(int num) {
    return switch (num) {
        case 0 -> "zero";
        case int n when n > 0 -> "positive";
        case int n when n < 0 -> "negative";
    };
}
```

## Incubator Features

### Vector API (JEP 417) - **Third Incubator**

Continued refinement of SIMD operations API.

**Performance improvement:**

```java
import jdk.incubator.vector.*;

void addArrays(float[] a, float[] b, float[] c) {
    var species = FloatVector.SPECIES_PREFERRED;
    int i = 0;
    for (; i < species.loopBound(a.length); i += species.length()) {
        var va = FloatVector.fromArray(species, a, i);
        var vb = FloatVector.fromArray(species, b, i);
        va.add(vb).intoArray(c, i);
    }
    // Handle remainder
    for (; i < a.length; i++) {
        c[i] = a[i] + b[i];
    }
}
```

**Speedup**: 4-8x faster than scalar code

### Foreign Function & Memory API (JEP 419) - **Second Incubator**

Refined API for calling native code and accessing off-heap memory.

**Example (calling C strlen):**

```java
import java.lang.foreign.*;

Linker linker = Linker.nativeLinker();
SymbolLookup stdlib = linker.defaultLookup();

MethodHandle strlen = linker.downcallHandle(
    stdlib.find("strlen").orElseThrow(),
    FunctionDescriptor.of(ValueLayout.JAVA_LONG, ValueLayout.ADDRESS)
);

try (Arena arena = Arena.openConfined()) {
    MemorySegment str = arena.allocateUtf8String("Hello");
    long length = (long) strlen.invoke(str);
    System.out.println(length); // 5
}
```

## Other Features

### Internet-Address Resolution SPI (JEP 418)

Service Provider Interface for custom hostname resolution.

**Use case:** Override DNS resolution for testing or special network environments

**Example:**

```java
public class CustomResolver extends InetAddressResolverProvider {
    @Override
    public InetAddressResolver get(Configuration config) {
        return new InetAddressResolver() {
            @Override
            public Stream<InetAddress> lookupByName(String host, LookupPolicy policy) {
                if (host.equals("example.test")) {
                    return Stream.of(InetAddress.getLoopbackAddress());
                }
                return InetAddressResolver.builtinResolver().lookupByName(host, policy);
            }
        };
    }
}
```

### Reimplement Core Reflection with Method Handles (JEP 416)

Internal improvement - reflection now uses `MethodHandles` internally.

**User impact:** Faster reflection performance, smaller footprint

### Deprecate Finalization for Removal (JEP 421)

`finalize()` method deprecated for removal in future release.

**Problem with finalization:**

- Unpredictable execution time
- Performance overhead
- Resource leak risks
- Complexity

**Alternatives:**

```java
// ❌ OLD: finalize()
@Override
protected void finalize() {
    closeResource();
}

// ✅ MODERN: try-with-resources
try (var resource = new MyResource()) {
    resource.use();
}

// ✅ MODERN: Cleaner
Cleaner cleaner = Cleaner.create();
cleaner.register(obj, () -> closeResource());
```

## Migration Considerations

**Upgrading from Java 17 LTS:**

1. **UTF-8 default**: Test applications that read/write files with platform-specific encoding
2. **Finalization**: Replace `finalize()` with try-with-resources or Cleaner
3. **Preview features**: Pattern matching for switch requires `--enable-preview`

**Compatibility:** Binary compatible with Java 17

## Related Topics

- [Java 17 LTS](/en/learn/software-engineering/programming-languages/java/release-highlights/java-17-lts) - Previous LTS
- [Java 19](/en/learn/software-engineering/programming-languages/java/release-highlights/java-19) - Next release (Virtual Threads!)
- [Pattern Matching](/en/learn/software-engineering/programming-languages/java/in-the-field/functional-programming) - In-the-field guide

## References

**Sources:**

- [Java 18 Features (with Examples)](https://www.happycoders.eu/java/java-18-features/)
- [New Java 18 Features | JRebel by Perforce](https://www.jrebel.com/blog/java-18-features)
- [What is new in Java 18 - Mkyong.com](https://mkyong.com/java/what-is-new-in-java-18/)
- [Java 18 is Now Available - InfoQ](https://www.infoq.com/news/2022/03/java18-released/)

**Official OpenJDK JEPs:**

- [JEP 400: UTF-8 by Default](https://openjdk.org/jeps/400)
- [JEP 408: Simple Web Server](https://openjdk.org/jeps/408)
- [JEP 413: Code Snippets in Java API Documentation](https://openjdk.org/jeps/413)
- [JEP 420: Pattern Matching for switch (Second Preview)](https://openjdk.org/jeps/420)
- [JEP 421: Deprecate Finalization for Removal](https://openjdk.org/jeps/421)
