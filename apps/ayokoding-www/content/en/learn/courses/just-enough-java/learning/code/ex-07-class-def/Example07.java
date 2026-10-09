public final class Example07 {
    static final class Task {
        String name; // => instance field
        // => A new Task initially has null in this reference field.
    }
    public static void main(String[] args) {
        Task task = new Task(); // => new creates one Task with its own name field.
        task.name = "read"; // => Only this object’s name field becomes read.
        // => The field update does not change any other Task instance.
        System.out.println(task.name); // => prints the value assigned to this Task: read
        // => Reading the field from task sees its latest assigned value.
    }
}
