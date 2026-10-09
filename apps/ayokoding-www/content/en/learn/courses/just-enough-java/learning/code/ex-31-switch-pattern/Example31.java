public final class Example31 {
    sealed interface Shape permits Circle, Square {}
    // => Only Circle and Square are permitted direct shapes.
    record Circle(int radius) implements Shape {}
    // => A Circle stores one radius component.
    record Square(int side) implements Shape {}
    // => A Square stores one side component.
    static int measure(Shape shape) {
        // => The helper accepts either subtype through Shape.
        return switch (shape) {
            // => The selected arm supplies the int returned by measure.
            case Circle circle -> circle.radius();
            // => The Circle pattern binds circle before its accessor runs.
            // => For Circle(2), the selected arm evaluates to 2.
            case Square square -> square.side();
            // => The Square pattern binds square before its accessor runs.
        }; // => chooses by runtime variant
    }
    public static void main(String[] args) {
        System.out.println(measure(new Circle(2))); // => 2
        // => The Square arm is skipped for this runtime value.
    }
}
