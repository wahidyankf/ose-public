// Example 33: Executable Jar Packages the App.
// The jar tool bundles compiled classes with a main-class manifest,
// so one file ships the program and java -jar runs it anywhere.
public class Main {

  // => one public class per file, named after the file
  static int total(int[] amounts) {
    // => the tiny domain: sum the dues
    int sum = 0; // => accumulator starts at the identity
    for (int amount : amounts) {
      // => one pass over every figure
      sum += amount; // => plain addition, no library needed
    } // => loop ends with the settled sum
    return sum; // => the total for the manifest-launched run
  } // => helper ends: pure arithmetic, runnable anywhere

  public static void main(String[] args) {
    // => the manifest names this entry point
    int[] dues = { 50, 75, 25 }; // => fixed figures, no input files
    System.out.println("members: " + dues.length); // => Output: members: 3
    System.out.println("total: " + total(dues)); // => Output: total: 150
    System.out.println("ships as one jar: true"); // => Output: ships as one jar: true
  } // => main ends: same transcript, class file or jar alike
}
