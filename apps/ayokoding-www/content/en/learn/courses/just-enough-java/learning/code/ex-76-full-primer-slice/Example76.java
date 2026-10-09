import java.util.List;
public final class Example76 {
    sealed interface State permits Open, Done {}
    // => Only Open and Done may directly implement State.
    record Open() implements State {}
    // => Open has no extra component values.
    record Done() implements State {}
    // => Done has no extra component values.
    record Task(String name, State state) {}
    // => Each task pairs a name with one state variant.
    static String render(Task task) {
        // => The helper turns a task into readable text.
        return switch (task.state()) {
            // => The switch selects behavior from runtime state.
            case Open ignored -> task.name() + ": open"; // => read: open
            // => The Open arm uses the task name read.
            case Done ignored -> task.name() + ": done"; // => write: done
            // => The Done arm uses the task name write.
        };
    }
    public static void main(String[] args) {
        List<Task> tasks = List.of(new Task("read", new Open()), new Task("write", new Done()));
        // => The input has one task in each state.
        tasks.stream().map(Example76::render).forEach(System.out::println); // => two lines in input order
        // => The terminal operation prints both rendered tasks.
    }
}
