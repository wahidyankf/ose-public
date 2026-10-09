import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
public final class Example44 {
    record Task(int id, String name) {}
    // => Task::id and Task::name refer to generated accessors.
    // => Duplicate IDs, not duplicate names, conflict in this map.
    public static void main(String[] args) {
        Map<Integer, String> byId = List.of(new Task(1, "read"), new Task(2, "write")) // => The input records have distinct IDs 1 and 2.
        // => The output key type is Integer and value type is String.
                .stream().collect(Collectors.toMap(Task::id, Task::name)); // => The map associates each ID with its task name.
                // => ID 1 maps to read and ID 2 maps to write.
                // => A repeated ID would make this two-argument collector throw.
        System.out.println(byId.get(2)); // => ID 2 resolves to the name write
        // => The lookup selects the value paired with ID 2.
        // Duplicate keys require an explicit merge function or fail.
    }
}
