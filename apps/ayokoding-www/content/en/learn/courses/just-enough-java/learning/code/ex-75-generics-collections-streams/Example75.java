import java.util.List;
public final class Example75 {
    static <T> List<T> withoutFirst(List<T> values) {
        // => T links the input and output element types.
        return values.stream().skip(1).toList(); // => drops first, preserves T
        // => skip(1) removes draft from this two-item input.
    }
    public static void main(String[] args) {
        System.out.println(withoutFirst(List.of("draft", "ready"))); // => [ready]
        // => The inferred T is String here.
        // => The result still contains ready.
    }
}
