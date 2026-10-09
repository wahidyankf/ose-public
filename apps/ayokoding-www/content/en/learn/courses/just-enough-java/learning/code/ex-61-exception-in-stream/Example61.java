import java.util.List;
public final class Example61 {
    static int parse(String text) {
        // => The helper converts each input String to an int.
        try { return Integer.parseInt(text); } // => valid digits become int
        catch (NumberFormatException problem) { return 0; } // => explicit local fallback
        // => Only malformed text takes the zero fallback.
    }
    public static void main(String[] args) {
        int sum = List.of("2", "bad", "3").stream().mapToInt(Example61::parse).sum(); // => 2 + 0 + 3
        // => The mapped values are 2, 0, and 3.
        System.out.println(sum); // => 5
        // => The terminal sum yields 5 after fallback conversion.
    }
}
