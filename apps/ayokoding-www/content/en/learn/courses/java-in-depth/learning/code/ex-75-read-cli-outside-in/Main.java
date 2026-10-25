// Example 75: Read CLIs Outside In.
// Command programs read from the edges inward: argument shape first,
// dispatch second, domain last. Start at usage text and exit codes;
// the flags map tells you every behavior before any logic runs.
// Reading order: usage, dispatch, domain, then exit codes.
public class Main {

  // => one public class per file, named after the file
  static void usage() {
    // => USAGE (read first): the complete behavior map
    System.out.println("usage: dues <total|count|top> [lines...]"); // => three commands, line args after
    System.out.println("  total: sum the amounts of member:amount lines"); // => command one promised here
    System.out.println("  count: count valid member:amount lines"); // => command two promised here
    System.out.println("  top: print the member with the largest amount"); // => command three promised here
  } // => usage ends: every behavior named before any runs

  static int amountOf(String line) {
    // => DOMAIN (read third): parsing beneath dispatch
    return Integer.parseInt(line.split(":")[1]); // => amount half, trusted after validation
  } // => domain ends: one expression, called only when valid

  static boolean valid(String line) {
    // => DOMAIN: the validity rule dispatch relies on
    String[] parts = line.split(":"); // => two fields or corrupt
    if (parts.length != 2) {
      // => shape check first
      return false; // => corrupt shapes never reach parsing
    } // => arity settled from here on
    try {
      // => the numeric half may still refuse
      return Integer.parseInt(parts[1]) >= 0; // => numeric and non-negative wins
    } catch (NumberFormatException e) {
      // => non-numeric loses uniformly
      return false; // => refusal, not explosion
    } // => catch ends: every path answered
  } // => validity ends: dispatch calls this, never duplicates it

  static int run(String[] args) {
    // => DISPATCH (read second): flags to behaviors
    if (args.length == 0) {
      // => no command: usage plus the failure code
      usage(); // => behavior map printed for the lost user
      return 2; // => EXIT CODE: 2 means usage error, read last
    } // => past this line a command word exists
    String command = args[0]; // => the verb dispatching everything
    java.util.List<String> lines = new java.util.ArrayList<>(); // => valid lines collected once
    for (int i = 1; i < args.length; i++) {
      // => arguments after the verb are data
      if (valid(args[i])) {
        // => dispatch filters through the domain rule
        lines.add(args[i]); // => only valid lines reach behaviors
      } // => invalid arguments skip silently here, counted never
    } // => collection ends: behaviors see clean input only
    switch (command) {
      // => the verb fans out to three behaviors
      case "total": // => behavior one: sum valid amounts
        System.out.println("total: " + lines.stream().mapToInt(Main::amountOf).sum()); // => Output depends on args
        return 0; // => EXIT CODE: 0 means success
      case "count": // => behavior two: count valid lines
        System.out.println("count: " + lines.size()); // => Output depends on args
        return 0; // => EXIT CODE: 0 means success
      case "top": // => behavior three: richest member first
        lines.sort((a, b) -> Integer.compare(amountOf(b), amountOf(a))); // => descending by amount
        System.out.println("top: " + (lines.isEmpty() ? "none" : lines.get(0))); // => Output depends on args
        return 0; // => EXIT CODE: 0 means success
      default: // => unknown verb: usage plus the failure code
        usage(); // => behavior map printed again for the typo
        return 2; // => EXIT CODE: 2 means usage error
    } // => dispatch ends: three behaviors, two exit codes
  } // => run ends: testable dispatch returning codes, printing little

  public static void main(String[] args) {
    // => THIN MAIN: exit code out, nothing else
    System.exit(run(new String[] { "total", "sari:50", "budi:75", "oops" })); // => fixed demo args: total over two valid
  } // => Output: total: 125, then exit 0
}
