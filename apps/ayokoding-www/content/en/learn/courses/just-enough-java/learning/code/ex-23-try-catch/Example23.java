public final class Example23 {
    static int parse(String text) {
        // => The parser promises an int result or an unchecked failure.
        return Integer.parseInt(text); // => may throw NumberFormatException
        // => The string no number cannot be converted to an int.
    }
    public static void main(String[] args) {
        try {
            // => The call is inside the recovery boundary.
            System.out.println(parse("no number")); // => The parser throws before println receives a value.
        } catch (NumberFormatException problem) {
            // => Only the expected parse failure enters this handler.
            System.out.println("invalid number"); // => controlled failure message
            // => The fallback text is printed after the parse fails.
        }
    }
}
