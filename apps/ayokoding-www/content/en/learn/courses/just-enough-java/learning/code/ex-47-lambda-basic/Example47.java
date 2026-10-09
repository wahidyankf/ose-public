import java.util.function.Predicate;
public final class Example47 {
    public static void main(String[] args) {
        Predicate<String> nonBlank = text -> !text.isBlank(); // => lambda implements one method
        // => The functional method is test(String).
        System.out.println(nonBlank.test(" Java ")); // => true
        // => Whitespace around Java does not make it blank.
        System.out.println(nonBlank.test(" ")); // => false
        // => A space-only string is blank.
    }
}
