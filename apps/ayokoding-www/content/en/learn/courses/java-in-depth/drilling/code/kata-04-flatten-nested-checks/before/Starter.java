// Starter: validation staircase. The smell: three nested ifs bury
// the work three indentations deep; readers hold every condition.
// Your task: guard-clause each failure so the work sits at the margin.
public class Starter {

  // => the imperfect starting point, fixed in After
  static String tag(String member, int amount) {
    // => nested validation around one line of work
    if (member != null) {
      // => level one: null check opens the staircase
      if (!member.isBlank()) {
        // => level two: blank check narrows further
        if (amount >= 0) {
          // => level three: sign check buries the work
          return member + ":" + amount; // => the work, three levels deep
        } else {
          // => level three failure, indented with it
          return "error: negative"; // => refusal far from the door
        } // => level three ends
      } else {
        // => level two failure
        return "error: blank"; // => refusal two levels deep
      } // => level two ends
    } else {
      // => level one failure
      return "error: null"; // => refusal at maximum nesting
    } // => staircase ends: work buried, refusals scattered
  } // => starter ends: valid shape, unreadable depth

  public static void main(String[] args) {
    // => exercises the staircase once
    System.out.println(tag("sari", 50)); // => prints sari:50 from three deep
  } // => main ends: correct, but nested
} // => fix me: three guards, then the work at the margin
