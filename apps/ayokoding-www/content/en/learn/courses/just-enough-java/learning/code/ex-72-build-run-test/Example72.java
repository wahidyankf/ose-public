public final class Example72 {
    static int square(int number) { return number * number; }
    // => square(4) computes 4 × 4.
    public static void main(String[] args) {
        int actual = square(4); // => 16
        // => The assertion below checks the returned value, not compilation.
        if (actual != 16) throw new AssertionError("expected 16, got " + actual); // => fails if behavior changes
        System.out.println("build, run, assertion passed"); // => only after the check succeeds
        // => The message is reached only if actual equals 16.
    }
}
