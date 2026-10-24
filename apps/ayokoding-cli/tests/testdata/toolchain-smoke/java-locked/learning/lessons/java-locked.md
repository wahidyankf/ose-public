# Java locked dependencies hello

The unit compiles against the locked jars and prints a fixed line.

**`learning/code/ex-01-deps/Deps.java`**

```java
import com.google.gson.Gson;

public class Deps {
    public static void main(String[] args) {
        System.out.println("deps-ok:" + new Gson().toJson(new int[] {1, 2}));
    }
}
```

**Output** (`learning/code/ex-01-deps/expected/main.stdout.txt`):

```text
deps-ok:[1,2]
```
