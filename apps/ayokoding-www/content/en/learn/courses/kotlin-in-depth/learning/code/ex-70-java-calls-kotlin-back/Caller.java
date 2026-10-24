// Caller.java: the Java reporter across the boundary.
// Calls LibKt functions like any static Java method; values cross,
// promises stay on the Kotlin side where the compiler enforces them.
public class Caller {

  // => plain Java main, reporting through Kotlin logic
  public static void main(String[] args) {
    // => the entry point the harness runs
    java.util.Map<String, Integer> dues = java.util.Map.of("sari", 50, "budi", 75); // => Java-side dues table
    System.out.println("total: " + LibKt.duesTotal(dues)); // => Output: total: 125, Kotlin logic from Java
    System.out.println("sari: " + LibKt.duesOf("sari")); // => Output: sari: 50
    System.out.println("dewi: " + LibKt.duesOf("dewi")); // => Output: dewi: 0, calm zero crosses too
  } // => main ends: Java reports, Kotlin computes, values cross
} // => compile kotlinc first, then javac against the jar
