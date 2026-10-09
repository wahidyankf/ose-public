public final class Example68 {
    static final class Box { int value; }
    public static void main(String[] args) {
        int number = 1; // => original primitive remains 1
        int copy = number; // => primitive value copied
        // => The assignment copies the value 1.
        Box first = new Box();
        // => The new Box initially has int field value zero.
        Box alias = first; // => reference value copied; both refer to one object
        // => Both variables refer to that same Box.
        copy++; // => copy becomes 2; number remains 1
        alias.value = 2; // => first.value also becomes 2
        // => The field write is visible through first.
        System.out.println(number + ":" + first.value); // => 1:2
        // Avoid treating JVM storage layout as a Java language guarantee.
    }
}
