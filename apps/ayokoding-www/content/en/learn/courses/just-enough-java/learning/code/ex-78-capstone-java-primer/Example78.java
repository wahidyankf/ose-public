import java.util.List;
public final class Example78 {
    sealed interface State permits Open, Done {}
    // => The permitted states make the model closed.
    record Open() implements State {}
    // => Open has no payload; it marks a task as included.
    record Done() implements State {}
    // => Done has no payload; it marks a task as excluded.
    record Task(String name, State state) {}
    // => Each record stores a name and state.
    static List<String> openTaskNames(List<Task> tasks) {
        // => The report accepts any list of Task values.
        return tasks.stream().filter(task -> task.state() instanceof Open) // => keeps zebra, alpha
        // => Filtering removes the task named done.
                .map(Task::name).sorted().toList(); // => [alpha, zebra]
                // => The report sorts names after projection.
    }
    public static void main(String[] args) {
        var tasks = List.of(new Task("zebra", new Open()), new Task("done", new Done()),
        // => The input contains two Open tasks and one Done task.
                new Task("alpha", new Open()));
        var actual = openTaskNames(tasks); // => [alpha, zebra]
        // => The output is [alpha, zebra] regardless of input order.
        if (!actual.equals(List.of("alpha", "zebra"))) throw new AssertionError(actual); // => verifies report
        // => A missing or unsorted name fails the check.
        System.out.println(actual); // => [alpha, zebra]
    }
}
