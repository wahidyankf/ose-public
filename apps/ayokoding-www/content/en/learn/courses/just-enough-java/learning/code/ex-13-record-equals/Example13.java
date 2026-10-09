public final class Example13 {
    record Task(String name, int priority) {}
    // => Generated equals compares both components.
    public static void main(String[] args) {
        Task first = new Task("read", 1); // => first is one record instance.
        // => The first allocation has name read and priority 1.
        Task second = new Task("read", 1); // => second is a distinct instance with equal components.
        // => The second allocation has the same component values.
        System.out.println(first.equals(second)); // => true; component equality
    }
}
