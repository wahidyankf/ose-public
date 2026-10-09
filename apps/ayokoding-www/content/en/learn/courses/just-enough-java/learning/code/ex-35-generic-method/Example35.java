public final class Example35 {
    static <T> T choose(T first, T second, boolean useFirst) {
        // => The type variable relates both arguments to the return type.
        return useFirst ? first : second; // => result and arguments share T
        // => True selects first; false selects second.
    }
    public static void main(String[] args) {
        System.out.println(choose("left", "right", true)); // => left
        // => String is inferred for T at this call.
    }
}
