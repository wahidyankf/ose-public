import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
public final class Example53 {
    record Task(String name, boolean done) {} // => done is the grouping key
    // => The done component decides which Boolean group receives each task.
    public static void main(String[] args) {
        Map<Boolean, List<Task>> groups = List.of(new Task("read", false), new Task("write", true))
        // => The input contains one false task and one true task.
                .stream().collect(Collectors.groupingBy(Task::done)); // => false and true groups
                // => The false key maps to the read task list.
                // => The true key maps to the write task list.
        System.out.println(groups.get(false).get(0).name()); // => prints read from the false group
        // => Lookup by false selects the unfinished group.
        // => Index zero then selects its first task name.
    }
}
