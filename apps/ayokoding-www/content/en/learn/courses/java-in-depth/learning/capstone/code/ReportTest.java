// ReportTest.java: the capstone contract, hand-rolled and green.
// Twelve checks over parseLine, summarize, and render: valid lines
// settle, four corrupt shapes refuse, totals fold, text renders exact.
// Run with -ea: assertions arm the internal contracts too.
import java.util.List; // => the fixture feeds per check
import java.util.Map; // => the expected per-member tables

public class ReportTest {

  // => the suite the test run executes
  static int failures = 0; // => banked failures decide the exit verdict

  static void check(String name, boolean condition) {
    // => one assertion, uniformly reported
    if (condition) {
      // => green path: name the pass
      System.out.println("PASS " + name); // => PASS lines prove each check ran
    } else {
      // => red path: bank the failure for the summary
      System.out.println("FAIL " + name); // => FAIL lines name the breakage precisely
      failures++; // => banked: nonzero failures fail the run
    } // => branch ends: every check reported exactly once
  } // => check ends: the suite's only vocabulary

  static void checkThrows(String name, String fragment, Runnable attempt) {
    // => pins refusal type plus message
    try {
      // => run the attempt that must refuse
      attempt.run(); // => success here means the contract broke
      check(name, false); // => FAIL: nothing was thrown
    } catch (IllegalArgumentException e) {
      // => the one refusal type parseLine raises
      check(name, e.getMessage().contains(fragment)); // => fragment witnessed in the message
    } // => catch ends: refusal certified or reported
  } // => checkThrows ends: failure contracts pinned

  public static void main(String[] args) {
    // => run with -ea: assertions enabled
    Report.Due due = Report.parseLine("sari:50"); // => canonical valid line
    check("parses member", due.member().equals("sari")); // => Output: PASS parses member
    check("parses amount", due.amount() == 50); // => Output: PASS parses amount
    check("trims whitespace", Report.parseLine("  budi : 75 ").amount() == 75); // => PASS trims whitespace
    checkThrows("no colon refused", "member:amount", () -> Report.parseLine("oops")); // => PASS no colon refused
    checkThrows("blank member refused", "non-blank", () -> Report.parseLine(":40")); // => PASS blank member refused
    checkThrows("text amount refused", "integer", () -> Report.parseLine("budi:xx")); // => PASS text amount refused
    checkThrows("negative refused", ">= 0", () -> Report.parseLine("budi:-5")); // => PASS negative refused
    Report.Summary summary = Report.summarize(List.of("sari:50", "oops", "budi:75", "sari:25", "", "citra:xx")); // => mixed feed
    check("two members settled", summary.perMember().equals(Map.of("sari", 75, "budi", 75))); // => PASS two members settled
    check("total folds", summary.total() == 150); // => Output: PASS total folds
    check("two skipped", summary.skipped() == 2); // => Output: PASS two skipped
    String text = Report.render(summary); // => the report text under assertion
    check("renders headcount", text.contains("members: 2")); // => Output: PASS renders headcount
    check("renders total", text.contains("total: 150")); // => Output: PASS renders total
    System.out.println("failures: " + failures); // => Output: failures: 0
    if (failures > 0) {
      // => red suites exit nonzero: CI reads the code
      throw new AssertionError("red: " + failures + " failures"); // => unreachable here, kept as policy
    } // => green path continues past the guard
    System.out.println("suite green: true"); // => Output: suite green: true
  } // => main ends: thirteen checks, zero failures
} // => suite ends: contracts pinned, transcript golden
