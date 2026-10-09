public final class Example12 {
    record Task(String name, int priority) {}
    // => The declaration generates accessors with the component names.
    public static void main(String[] args) {
        Task task = new Task("read", 1); // => The record components are read and 1.
        // => Component order is name first and priority second.
        System.out.println(task.name());     // => read; generated accessor
        System.out.println(task.priority()); // => 1
        // => The int accessor returns the stored priority without conversion.
    }
}
