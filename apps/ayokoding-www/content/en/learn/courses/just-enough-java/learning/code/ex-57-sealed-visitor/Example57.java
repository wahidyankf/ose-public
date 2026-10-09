public final class Example57 {
    sealed interface Result permits Ok, Missing {}
    // => Only Ok and Missing are direct Result variants.
    record Ok(String value) implements Result {}
    // => Ok carries a String payload for rendering.
    record Missing() implements Result {}
    // => Missing has no payload, so it renders a fixed label.
    static String render(Result result) {
        // => The method must produce text for either variant.
        return switch (result) {
            // => The switch expression chooses a result from the runtime record type.
            case Ok(var value) -> "value:" + value; // => unwrap Ok payload
            // => The record pattern binds the Ok component to value.
            case Missing ignored -> "missing"; // => no payload to unwrap
        };
    }
    public static void main(String[] args) {
        System.out.println(render(new Missing())); // => missing
        // => A Missing instance selects the second case.
    }
}
