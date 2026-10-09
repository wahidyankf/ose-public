import java.util.List;
public final class Example38 {
    static double sum(List<? extends Number> numbers) {
        // => The wildcard accepts List<Integer> and List<Double>.
        // => The unknown subtype prevents adding an arbitrary Number.
        return numbers.stream().mapToDouble(Number::doubleValue).sum(); // => The Integer inputs become doubles, then sum to 6.0.
        // => Each element can be read as a Number.
    } // => reads any subtype of Number; cannot add an arbitrary Number
    public static void main(String[] args) {
        System.out.println(sum(List.of(1, 2, 3))); // => 6.0
        // => The three integer inputs contribute 1.0, 2.0, and 3.0.
    }
}
