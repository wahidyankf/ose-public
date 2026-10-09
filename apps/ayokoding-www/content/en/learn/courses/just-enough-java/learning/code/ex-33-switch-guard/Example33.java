public final class Example33 {
    record Circle(int radius) {}
    // => The pattern can deconstruct this one-component record.
    static String describe(Object value) {
        // => Object admits Circle and non-Circle inputs.
        return switch (value) {
            // => Cases are tested in order until one matches.
            case Circle(var radius) when radius > 0 -> "positive circle";
            // => The bound radius is 2 and passes the guard.
            // => The guarded case must appear before the broader Circle case.
            case Circle ignored -> "empty circle";
            // => This broader Circle case handles zero or negative radius.
            default -> "not a circle";
            // => Non-Circle values reach the fallback.
        }; // => guarded case must precede unguarded Circle
    }
    public static void main(String[] args) {
        System.out.println(describe(new Circle(2))); // => positive circle
        // => The result is the guarded branch's text.
    }
}
