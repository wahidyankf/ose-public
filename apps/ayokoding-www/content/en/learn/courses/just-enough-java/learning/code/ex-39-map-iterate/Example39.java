import java.util.Map;
public final class Example39 {
    public static void main(String[] args) {
        Map<String, Integer> scores = Map.of("Ada", 9, "Linus", 7); // => The map holds two key-value entries.
        // => The map contract does not promise traversal order.
        scores.entrySet().stream().sorted(Map.Entry.comparingByKey()) // => Sorting by key makes Ada appear before Linus.
        // => The entry set exposes both keys and values to the stream.
                .forEach(entry -> System.out.println(entry.getKey() + ":" + entry.getValue())); // => The report prints Ada:9, then Linus:7.
                // => The terminal operation emits one line per sorted entry.
    }
}
