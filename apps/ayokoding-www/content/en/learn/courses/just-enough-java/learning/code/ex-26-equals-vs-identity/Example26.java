public final class Example26 {
    public static void main(String[] args) {
        String first = new String("same"); // => first refers to a newly allocated String.
        // => new forces a distinct object instead of reusing a literal reference.
        String second = new String("same"); // => second refers to another String with equal characters.
        // => Both objects contain the same four characters.
        System.out.println(first == second);      // => false: different objects
        System.out.println(first.equals(second)); // => true: equal characters
    }
}
