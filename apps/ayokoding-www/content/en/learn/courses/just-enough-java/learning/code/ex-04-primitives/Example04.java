public final class Example04 {
    public static void main(String[] args) {
        int whole = 3;          // => 32-bit integer
        // => The left operand remains an int before the addition.
        double fraction = 2.5; // => floating-point number
        // => The double operand determines the promoted expression type.
        System.out.println(whole + fraction); // => 5.5, promoted to double
    }
}
