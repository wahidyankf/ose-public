public final class Example29 {
    sealed interface Result permits Success, Missing {}
    // => The permits list gives the switch a closed set of cases.
    record Success(String value) implements Result {}
    // => Success carries the value returned by its case.
    record Missing() implements Result {}
    // => Missing needs its own case because it has no value.
    static String render(Result result) {
        // => The method returns a String for either permitted variant.
        return switch (result) {
            // => The switch produces a value rather than only executing statements.
            case Success(var value) -> value; // => Success returns its carried value.
            // => The record pattern binds value from the Success component.
            case Missing ignored -> "missing"; // => Missing returns a label because it carries no value.
        }; // => all permitted record variants covered
    }
    public static void main(String[] args) {
        System.out.println(render(new Success("ready"))); // => ready
        // => Success("ready") selects the first case.
    }
}
