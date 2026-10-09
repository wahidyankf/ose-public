public final class Example09 {
    static final class Task {
        private final String name;
        // => A successful constructor assigns this field exactly once.
        Task(String name) {
            // => The constructor runs before a caller can use the new object.
            if (name.isBlank()) throw new IllegalArgumentException("blank name"); // => A blank name cannot produce a Task.
            // => Whitespace-only input follows the exception branch.
            this.name = name; // => constructor establishes a valid object
            // => Only the validated input reaches the assignment.
        }
    }
    public static void main(String[] args) {
        System.out.println(new Task("read").name); // => prints the validated name read
        // => The valid read value survives construction.
    }
}
