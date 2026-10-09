public final class Example27 {
    record Task(String name, int priority) {
        // => A Task carries two components whose generated fields are final.
        Task {
            // => This compact form receives component parameters before field assignment.
            if (name.isBlank() || priority < 0) { // => Blank names and negative priorities enter the rejection branch.
            // => | priority < 0) {|Either invalid condition is enough to reject the value.
                throw new IllegalArgumentException("invalid task");
                // => No Task is returned from a failing constructor.
            } // => compact constructor validates before field assignment
        }
    }
    public static void main(String[] args) {
        System.out.println(new Task("read", 1).priority()); // => 1
        // => The valid record retains priority 1.
    }
}
