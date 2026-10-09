import java.util.List;
public final class Example59 {
    static <T extends Number> double average(List<T> numbers) {
        // => Integer and Double lists both satisfy this bound.
        return numbers.stream().mapToDouble(Number::doubleValue).average().orElse(0); // => 0 for empty input
        // => Each Number becomes a double for averaging.
        // => An empty list yields fallback 0 rather than an absent result.
    }
    public static void main(String[] args) {
        System.out.println(average(List.of(2, 4))); // => 3.0
        // => The two integer inputs average to 3.0.
    }
}
