public final class Example37 {
    static <T extends Number> double doubled(T value) {
        // => The Number bound permits numeric wrapper arguments.
        return value.doubleValue() * 2; // => Number method available via bound
        // => An Integer 3 becomes double 3.0 before multiplication.
    }
    public static void main(String[] args) {
        System.out.println(doubled(3)); // => 6.0
        // => The generic call infers Integer for T.
    }
}
