import java.util.List;
public final class Example77 {
    static List<String> report(List<String> names) { return names.stream().sorted().toList(); } // => alphabetical report
    // => The helper leaves its input untouched.
    public static void main(String[] args) {
        List<String> actual = report(List.of("zebra", "alpha")); // => [alpha, zebra]
        // => The report is sorted independently of input order.
        if (!actual.equals(List.of("alpha", "zebra"))) throw new AssertionError(actual); // => checks expected order
        // => A wrong order causes an assertion failure.
        System.out.println(actual); // => [alpha, zebra]
    }
}
