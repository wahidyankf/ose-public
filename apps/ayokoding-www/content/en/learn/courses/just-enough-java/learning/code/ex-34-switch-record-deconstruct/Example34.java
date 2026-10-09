public final class Example34 {
    record Point(int x, int y) {}
    // => The Point record exposes two ordered components.
    public static void main(String[] args) {
        Object value = new Point(2, 3); // => The runtime value is a Point with components 2 and 3.
        String location = switch (value) { // => location receives the selected pattern’s result.
        // => A String is assigned from whichever case matches.
            case Point(var x, var y) -> x + "," + y; // => record pattern
            // => The pattern binds x=2 and y=3.
            default -> "unknown";
            // => A non-Point object would produce unknown.
        };
        System.out.println(location); // => 2,3
    }
}
