import java.util.List;
public final class Example49 {
    public static void main(String[] args) {
        List<String> upper = List.of("ada", "linus").stream() // => The stream visits ada before linus.
        // => Each lower-case name enters the mapper once.
                .map(String::toUpperCase).toList(); // => method reference in place of lambda
                // => The method reference is equivalent to name -> name.toUpperCase().
        System.out.println(upper); // => [ADA, LINUS]
        // => The result keeps the source order.
    }
}
