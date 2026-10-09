public final class Example74 {
    sealed interface Result permits Found, Missing {}
    // => The switch knows the complete set of direct variants.
    record Found(String value) implements Result {}
    // => Found carries a value for uppercasing.
    record Missing() implements Result {}
    // => Missing carries no text and needs a fallback.
    static String display(Result result) {
        // => The method returns a String for either result shape.
        return switch (result) {
            // => A matching case supplies the return value.
            case Found(var value) -> value.toUpperCase(); // => ready becomes READY
            // => The pattern binds ready from Found("ready").
            case Missing ignored -> "unavailable"; // => missing fallback
        };
    }
    public static void main(String[] args) {
        System.out.println(display(new Found("ready"))); // => READY
        // => The Missing branch is skipped for this input.
    }
}
