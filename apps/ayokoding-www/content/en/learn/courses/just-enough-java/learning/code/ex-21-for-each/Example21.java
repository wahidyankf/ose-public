import java.util.List;
public final class Example21 {
    public static void main(String[] args) {
        for (String name : List.of("Ada", "Linus")) { // => name becomes Ada, then Linus without an index variable.
        // => The enhanced loop supplies the next element each iteration.
            System.out.println(name.toUpperCase()); // => ADA, then LINUS
            // => The original list entries remain unchanged.
            // => This prints once for Ada and once for Linus.
        }
    }
}
