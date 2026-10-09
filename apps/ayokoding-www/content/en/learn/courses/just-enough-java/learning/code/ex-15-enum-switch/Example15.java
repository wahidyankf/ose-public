public final class Example15 {
    enum Status { TODO, DONE }
    // => The switch must account for both declared constants.
    public static void main(String[] args) {
        Status status = Status.DONE; // => The DONE arm will supply the switch value.
        String message = switch (status) { // => message receives the selected arm’s String.
        // => A switch expression yields one String assigned to message.
            case TODO -> "open"; // => TODO would produce open.
            case DONE -> "closed"; // => DONE produces closed for this input.
            // => The active case yields closed; TODO is not evaluated.
        }; // => both enum values covered
        System.out.println(message); // => closed
    }
}
