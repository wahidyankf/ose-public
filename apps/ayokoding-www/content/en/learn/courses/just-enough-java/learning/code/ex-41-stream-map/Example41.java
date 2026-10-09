import java.util.List;
public final class Example41 {
    public static void main(String[] args) {
        List<Integer> doubled = List.of(1, 2, 3).stream() // => The ordered source provides 1, 2, then 3.
        // => The stream is not consumed until toList runs.
                .map(number -> number * 2).toList(); // => transform each element
                // => The mapper yields 2, 4, and 6 in encounter order.
        System.out.println(doubled); // => [2, 4, 6]
        // => The collected list makes the transformation visible.
    }
}
