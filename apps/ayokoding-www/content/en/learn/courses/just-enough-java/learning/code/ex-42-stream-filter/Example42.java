import java.util.List;
public final class Example42 {
    public static void main(String[] args) {
        List<Integer> even = List.of(1, 2, 3, 4).stream() // => The source contains both matching and nonmatching numbers.
        // => The stream visits values in list encounter order.
                .filter(number -> number % 2 == 0).toList(); // => retain matches
                // => The predicate is true for 2 and 4 only.
        System.out.println(even); // => [2, 4]
        // => The selected values retain their encounter order.
    }
}
