// Example 18: Text Blocks for Templates.
// Text blocks keep multi-line templates readable: the receipt below
// looks like its output, with stripIndent trimming the margin.
public class Main {

  // => one public class per file, named after the file
  public static void main(String[] args) {
    // => the entry point the harness runs
    String member = "sari"; // => the member this receipt settles
    int amount = 50; // => the dues paid, in whole units
    // => text block opens below: everything to the fence is literal
    // => indentation inside the block is output shape, not code nesting
    // => placeholders stay symbolic until formatted fills them
    String receipt = """
    RECEIPT
    member: %s
    amount: %d
    status: SETTLED
    """
      .stripIndent()
      .formatted(member, amount); // => trim margin, fill placeholders
    System.out.print(receipt); // => Output: the four receipt lines
    // => second block: commas need no escaping inside text blocks
    // => two data lines plus the closing fence: three literal lines
    String csv = """
    sari,50
    budi,75
    """; // => closing fence sets the margin for every line
    // => stripIndent aligns the block to the left before printing
    System.out.print(csv.stripIndent()); // => Output: the two CSV lines verbatim
    // => lines() streams the receipt for shape assertions without splitting
    System.out.println("lines: " + receipt.lines().count()); // => Output: lines: 4
  } // => main ends: templates printed exactly as written
}
