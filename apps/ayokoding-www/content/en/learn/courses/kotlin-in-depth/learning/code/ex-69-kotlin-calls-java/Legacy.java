// Legacy.java: the inherited Java helper.
// Trims and lowercases member names; Java strings arrive as platform
// types, so the Kotlin caller pins nullability at the boundary.
public class Legacy {

  // => plain Java: no Kotlin in this file at all
  public static String normalize(String raw) {
    // => static helper, callable as Legacy.normalize
    if (raw == null) return ""; // => Java-side guard: null becomes empty, documented
    return raw.trim().toLowerCase(); // => the inherited behavior, unchanged
  } // => helper ends: trim plus lowercase, the legacy contract
} // => compile with javac first, then kotlinc against its output
