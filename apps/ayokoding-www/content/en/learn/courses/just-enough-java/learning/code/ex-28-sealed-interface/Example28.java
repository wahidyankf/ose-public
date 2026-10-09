public final class Example28 {
    sealed interface Result permits Success, Missing {}
    // => Only Success and Missing may directly implement Result.
    record Success(String value) implements Result {}
    // => Success carries a String payload.
    record Missing() implements Result {}
    // => Missing has no payload components.
    public static void main(String[] args) {
        Result result = new Missing(); // => result has the permitted Missing variant.
        // => The static type is Result; the runtime variant is Missing.
        System.out.println(result instanceof Missing); // => true
        // => The type check succeeds for this variant.
    }
}
