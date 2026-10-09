import java.io.IOException;
public final class Example24 {
    static String read(boolean available) throws IOException {
        // => The throws clause makes the checked failure visible to callers.
        if (!available) throw new IOException("missing"); // => checked failure
        // => False availability selects the failure path.
        return "data"; // => The successful branch returns data.
        // => True availability reaches this return instead.
    }
    public static void main(String[] args) throws IOException {
        // => The caller declares rather than catches IOException.
        System.out.println(read(true)); // => data; caller declares failure
    }
}
