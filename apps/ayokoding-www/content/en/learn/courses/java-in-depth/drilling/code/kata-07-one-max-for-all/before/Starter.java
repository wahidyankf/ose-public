// Starter: duplicated maxima. The smell: maxInt and maxString share
// every line but their types; the third type will copy them again.
// Your task: one bounded generic max over Comparable, both call sites kept.
public class Starter {

  // => the imperfect starting point, fixed in After
  static int maxInt(int a, int b) {
    // => integers only: first copy
    return a >= b ? a : b; // => comparison hardwired to int
  } // => first copy ends: correct, but narrow

  static String maxString(String a, String b) {
    // => strings only: second copy
    return a.compareTo(b) >= 0 ? a : b; // => same shape, other type
  } // => second copy ends: duplication witnessed

  public static void main(String[] args) {
    // => exercises both copies once
    System.out.println("max int: " + maxInt(50, 75)); // => prints 75 via the first copy
    System.out.println("max string: " + maxString("budi", "sari")); // => prints sari via the second copy
  } // => main ends: duplicated, but green
} // => fix me: max(T extends Comparable<T>) serves both call sites
