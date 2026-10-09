public final class Example66 {
    interface Named {
        // => The contract requires every implementor to provide name().
        String name();
        // => The abstract method supplies data to the default method.
        default String label() { return "task:" + name(); } // => prefixes implementor name
    }
    record Task(String name) implements Named {} // => supplies name()
    // => The generated record accessor satisfies the contract.
    public static void main(String[] args) {
        System.out.println(new Task("read").label()); // => task:read
        // => The inherited default method calls Task.name().
    }
}
