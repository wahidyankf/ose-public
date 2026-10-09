public final class Example65 {
    enum Priority {
        LOW(1), HIGH(5); // => each constant has its own score
        // => HIGH carries score 5; LOW carries score 1.
        private final int score;
        // => The score is fixed when each constant is constructed.
        Priority(int score) { this.score = score; } // => LOW stores 1, HIGH stores 5
        // => The constructor receives the literal from each constant.
        int score() { return score; }
        // => The accessor returns the constant's stored number.
    }
    public static void main(String[] args) {
        System.out.println(Priority.HIGH.score()); // => 5
        // => HIGH selects its own 5 rather than LOW's 1.
    }
}
