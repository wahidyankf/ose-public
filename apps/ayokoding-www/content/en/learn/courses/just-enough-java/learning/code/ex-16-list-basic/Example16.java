import java.util.List;
public final class Example16 {
    public static void main(String[] args) {
        List<String> names = List.of("Ada", "Linus"); // => The unmodifiable list has two ordered elements.
        // => List.of rejects additions and preserves these positions.
        System.out.println(names.get(0)); // => Ada; zero-based access
        // => Index zero selects Ada, not Linus.
        System.out.println(names.size()); // => 2
        // => There are two elements even though the last index is one.
    }
}
