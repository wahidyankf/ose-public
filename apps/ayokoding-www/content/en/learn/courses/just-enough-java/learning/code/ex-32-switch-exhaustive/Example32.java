public final class Example32 {
    sealed interface Shape permits Circle, Square {}
    // => The sealed parent exposes every permitted variant to the compiler.
    record Circle(int radius) implements Shape {}
    // => Circle carries the radius used by its area formula.
    record Square(int side) implements Shape {}
    // => Square carries the side used by its area formula.
    static int area(Shape shape) {
        // => The one method handles either Shape subtype.
        return switch (shape) {
            // => An exhaustive switch expression must yield an int.
            case Circle c -> (int) Math.round(Math.PI * c.radius() * c.radius());
            // => Circle uses πr², rounded to int.
            case Square s -> s.side() * s.side();
            // => Square(3) yields 3 × 3 = 9.
            // => The Square arm is selected for the value created below.
        }; // => no default needed: Shape is sealed
    }
    public static void main(String[] args) {
        System.out.println(area(new Square(3))); // => 9
        // => Adding another permitted subtype would require another case.
    }
}
