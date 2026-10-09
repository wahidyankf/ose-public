import java.util.Set;
public final class Example19 {
    public static void main(String[] args) {
        Set<String> tags = Set.of("java", "jvm"); // => two unique elements
        // => Set.of would reject a duplicate argument.
        // => The resulting set cannot be mutated.
        System.out.println(tags.size()); // => 2
        // => Size counts distinct elements, here two.
    }
}
