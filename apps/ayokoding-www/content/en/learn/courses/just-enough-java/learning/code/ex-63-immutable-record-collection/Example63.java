import java.util.List;
public final class Example63 {
    record Task(String name) {}
    // => The record's name component is a final field.
    public static void main(String[] args) {
        List<Task> source = List.of(new Task("read")); // => one record value
        // => The source already contains a record with name read.
        List<Task> snapshot = List.copyOf(source); // => add/remove operations fail
        // => copyOf does not make mutable component objects deeply immutable.
        System.out.println(snapshot); // => [Task[name=read]]
        // => The record-generated toString exposes the name component.
    }
}
