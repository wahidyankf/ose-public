// Example 26: One Class, One Job.
// Small classes with one responsibility compose better than a single
// class doing parsing, totaling, and printing all at once.
import java.util.List; // => the dues lines under test

public class Main {

  // => one public class per file, named after the file
  record Due(String member, int amount) {} // => parsing output: data, nothing else

  static Due parse(String line) {
    // => parsing job: text in, Due out
    String[] parts = line.split(":"); // => the member:amount grammar
    return new Due(parts[0], Integer.parseInt(parts[1])); // => typed pair, validated by construction
  } // => parse ends: no printing, no totaling

  static int total(List<Due> dues) {
    // => totaling job: dues in, sum out
    return dues.stream().mapToInt(Due::amount).sum(); // => primitive stream, no boxing
  } // => total ends: no parsing, no printing

  static String report(List<Due> dues) {
    // => printing job: dues in, text out
    return "members: " + dues.size() + ", total: " + total(dues); // => composition of the two jobs above
  } // => report ends: pure text, printed once by main

  public static void main(String[] args) {
    // => the entry point the harness runs
    List<Due> dues = List.of(parse("sari:50"), parse("budi:75")); // => parse each fixture line
    System.out.println(report(dues)); // => Output: members: 2, total: 125
    System.out.println("first: " + dues.get(0).member()); // => Output: first: sari
  } // => main ends: parse, total, and report each used once
}
