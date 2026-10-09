import java.util.List;
public final class Example52 {
    record Task(String name, boolean done) {}
    // => Each task carries its name and completion flag.
    public static void main(String[] args) {
        List<String> open = List.of(new Task("read", false), new Task("write", true)) // => Only read has done equal to false.
        // => The input has one unfinished and one finished task.
                .stream().filter(task -> !task.done()).map(Task::name).toList(); // => The report retains the open task and projects its name.
                // => Filtering precedes projection, so only read is mapped.
        System.out.println(open); // => [read]
        // => The report contains names, not Task records.
    }
}
