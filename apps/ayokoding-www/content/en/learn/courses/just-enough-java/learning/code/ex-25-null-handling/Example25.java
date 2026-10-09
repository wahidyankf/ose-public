import java.util.Objects;
public final class Example25 {
    public static void main(String[] args) {
        String possible = null; // => possible models an absent reference.
        // => No String object is reachable through possible.
        String fallback = Objects.requireNonNullElse(possible, "guest"); // => fallback becomes guest because possible is null.
        // => The fallback avoids dereferencing possible.
        System.out.println(fallback.toUpperCase()); // => GUEST
        // => The uppercase conversion operates on a non-null String.
    }
}
