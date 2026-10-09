import java.util.Comparator;
import java.util.List;
public final class Example48 {
    public static void main(String[] args) {
        Comparator<String> byLength = (left, right) -> Integer.compare(left.length(), right.length()); // => The comparator orders shorter strings before longer ones.
        // => A negative comparison result puts left before right.
        // => Equal lengths compare as zero; no lexical tie-break is supplied.
        List<String> sorted = List.of("pear", "fig", "apple").stream() // => The unsorted input lengths are 4, 3, and 5.
        // => Input order differs from length order.
                .sorted(byLength).toList(); // => fig, pear, apple
                // => Length three comes before lengths four and five.
        System.out.println(sorted);
        // => The printed list is [fig, pear, apple].
    }
}
