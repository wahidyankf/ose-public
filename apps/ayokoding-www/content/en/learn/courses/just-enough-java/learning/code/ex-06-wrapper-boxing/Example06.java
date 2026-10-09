public final class Example06 {
    public static void main(String[] args) {
        int primitive = 7; // => primitive holds the unboxed integer 7.
        Integer boxed = primitive; // => autoboxing into a reference
        // => The Integer reference can be null even though primitive cannot.
        int again = boxed;         // => unboxing into a primitive
        // => Unboxing a null Integer here would throw NullPointerException.
        System.out.println(again + 1); // => 8
    }
}
