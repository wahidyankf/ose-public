public final class Example14 {
    enum Status { OPEN, DONE }
    // => Only these two named Status values can be selected.
    public static void main(String[] args) {
        Status status = Status.OPEN; // => status holds one of the declared enum constants.
        // => The variable's value is the OPEN constant, not the text "OPEN".
        System.out.println(status.name()); // => OPEN
        // => name() returns the identifier spelling of the constant.
    }
}
