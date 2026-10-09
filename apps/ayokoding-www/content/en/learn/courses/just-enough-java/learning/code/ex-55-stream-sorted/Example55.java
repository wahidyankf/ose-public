import java.util.List;
public final class Example55 {
    public static void main(String[] args) {
        List<Integer> ascending = List.of(3, 1, 2).stream().sorted().toList(); // => [1, 2, 3]
        // => The source order is 3, 1, 2.
        // => Natural Integer order produces 1, 2, 3.
        System.out.println(ascending); // => [1, 2, 3]
        // => toList evaluates the sorted pipeline before printing.
    }
}
