import java.util.List;
public final class Example46 {
    public static void main(String[] args) {
        long count = List.of("red", "blue", "rose").stream() // => Two of the three words begin with r.
        // => The source has three words before filtering.
                .filter(word -> word.startsWith("r")).count(); // => terminal count
                // => The filter keeps red and rose before count evaluates.
        System.out.println(count); // => 2
        // => count returns a long, so the variable is long.
    }
}
