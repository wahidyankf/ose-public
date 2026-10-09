public final class Example08 {
    static final class Task {
        private final String name; // => Each Task stores one name that is set in its constructor.
        Task(String name) { this.name = name; } // => The constructor copies its argument into that object’s field.
        // => this.name identifies the field; plain name identifies the parameter.
        String label() { return "task:" + name; } // => instance method
        // => The method reads the receiver's private field without taking an argument.
    }
    public static void main(String[] args) {
        System.out.println(new Task("read").label()); // => task:read
        // => A fresh Task is constructed before label is called.
    }
}
