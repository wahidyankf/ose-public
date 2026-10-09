import java.util.Optional;
public final class Example51 {
    public static void main(String[] args) {
        Optional<String> value = Optional.of("java"); // => The optional contains java, so map will run.
        // => Optional.of rejects null and holds the supplied String.
        Optional<Integer> length = value.map(String::length); // => map keeps Optional shape
        // => The mapping yields present Integer 4.
        System.out.println(length.orElse(0)); // => 4
        // => The fallback zero is not selected for a present value.
    }
}
