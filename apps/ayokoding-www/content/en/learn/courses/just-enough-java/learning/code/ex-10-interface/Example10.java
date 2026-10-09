public final class Example10 {
    interface Named { String name(); } // => contract requires one method
    // => The interface describes a callable name without storing it.
    record Task(String name) implements Named {}
    // => The record-generated name() method satisfies Named.
    public static void main(String[] args) {
        Named item = new Task("read"); // => caller uses interface type
        // => The reference type limits calls to Named's contract.
        System.out.println("task:" + item.name()); // => task:read
    }
}
