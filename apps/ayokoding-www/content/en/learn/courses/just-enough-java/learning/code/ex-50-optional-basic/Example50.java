import java.util.Optional;
public final class Example50 {
    public static void main(String[] args) {
        Optional<String> missing = Optional.empty(); // => explicit absence
        // => There is no contained String to read.
        // => The type still records that a String may be present.
        System.out.println(missing.orElse("guest")); // => guest
        // => orElse supplies guest when the Optional is empty.
    }
}
