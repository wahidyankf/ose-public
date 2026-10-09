import java.util.List;
public final class Example54 {
    public static void main(String[] args) {
        List<String> words = List.of(List.of("red", "blue"), List.of("green")) // => two inner lists
        // => The outer list has two elements, each itself a list.
                .stream().flatMap(List::stream).toList(); // => each inner list contributes its words
                // => flatMap removes one level of nesting.
        System.out.println(words); // => [red, blue, green]
        // => Encounter order remains red, blue, green.
    }
}
