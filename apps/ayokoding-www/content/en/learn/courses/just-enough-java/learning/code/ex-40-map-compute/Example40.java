import java.util.HashMap;
import java.util.Map;
public final class Example40 {
    public static void main(String[] args) {
        Map<String, Integer> counts = new HashMap<>(); // => The initial map contains no counts.
        // => HashMap permits later counter updates.
        counts.merge("java", 1, Integer::sum); // => The first merge inserts java with count 1.
        // => No combining function runs when java is absent.
        counts.merge("java", 1, Integer::sum); // => existing count updated
        // => The second call combines old 1 with new 1.
        System.out.println(counts.get("java")); // => 2
        // => The final key lookup returns the merged count.
    }
}
