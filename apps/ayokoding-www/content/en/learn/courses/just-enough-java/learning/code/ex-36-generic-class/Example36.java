public final class Example36 {
    static final class Box<T> {
        // => T names the stored element type for this Box instance.
        private final T value;
        // => A Box<Integer> field stores an Integer value.
        Box(T value) { this.value = value; }
        // => Construction initializes the field with the supplied T.
        T get() { return value; }
        // => get preserves T without returning Object.
    }
    public static void main(String[] args) {
        Box<Integer> box = new Box<>(7); // => box stores an Integer value of 7.
        // => The diamond infers Integer from the target type.
        System.out.println(box.get() + 1); // => 8
        // => The returned Integer is unboxed for arithmetic.
    }
}
