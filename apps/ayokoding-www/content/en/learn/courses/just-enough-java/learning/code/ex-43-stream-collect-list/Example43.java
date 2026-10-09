import java.util.List;
import java.util.stream.Collectors;
public final class Example43 {
    public static void main(String[] args) {
        List<String> result = List.of("a", "b").stream() // => The input holds two lowercase strings.
        // => The source list itself is unmodifiable.
                .map(String::toUpperCase).collect(Collectors.toList()); // => The collected list holds A and B and can be mutated here.
                // => The method reference produces A, then B.
        result.add("C"); // => The mutable result now holds A, B, C.
        // => This mutation is on the collected result, not the source.
        System.out.println(result); // => [A, B, C]
        // => C appears after the two mapped elements.
    }
}
