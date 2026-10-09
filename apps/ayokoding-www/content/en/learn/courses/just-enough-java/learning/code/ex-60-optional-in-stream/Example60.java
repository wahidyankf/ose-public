import java.util.List;
import java.util.Optional;
public final class Example60 {
    public static void main(String[] args) {
        List<Optional<String>> values = List.of(Optional.of("Ada"), Optional.empty()); // => one present, one absent
        // => The second Optional has no contained String.
        // => The input list still has two Optional elements.
        List<String> present = values.stream().flatMap(Optional::stream).toList(); // => [Ada]
        // => Optional.stream emits Ada and emits nothing for empty.
        System.out.println(present); // => [Ada]; empty option contributes no element
        // => The resulting list has one element, not a null placeholder.
    }
}
