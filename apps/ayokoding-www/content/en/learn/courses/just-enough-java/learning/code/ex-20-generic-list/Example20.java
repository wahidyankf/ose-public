import java.util.List;
public final class Example20 {
    public static void main(String[] args) {
        List<String> names = List.of("Ada", "Linus"); // => elements are String
        // => The element type is checked when the list is created and read.
        String first = names.get(0); // => no cast required
        // => A String assignment is valid without a runtime cast here.
        System.out.println(first.toUpperCase()); // => ADA
        // => String.toUpperCase returns a new uppercase value.
    }
}
