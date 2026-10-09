import java.util.List;
public final class Example56 {
    public static void main(String[] args) {
        List<String> unique = List.of("a", "b", "a").stream().distinct().toList(); // => [a, b]
        // => The first and last elements compare equal.
        // => The second a is dropped; b stays.
        System.out.println(unique); // => [a, b]; encounter order preserved here
        // => The collected list contains two distinct values.
    }
}
