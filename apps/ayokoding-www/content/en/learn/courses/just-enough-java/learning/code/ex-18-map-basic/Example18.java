import java.util.Map;
public final class Example18 {
    public static void main(String[] args) {
        Map<String, Integer> scores = Map.of("Ada", 9, "Linus", 7); // => Ada maps to 9 and Linus maps to 7.
        // => The key type is String and each value is Integer.
        System.out.println(scores.get("Ada")); // => 9; lookup by key
        // => An absent key would return null instead of a score.
        // => This lookup needs no scan by numeric position.
    }
}
