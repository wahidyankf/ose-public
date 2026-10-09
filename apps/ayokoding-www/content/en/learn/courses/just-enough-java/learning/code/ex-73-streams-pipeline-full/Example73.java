import java.util.List;
public final class Example73 {
    public static void main(String[] args) {
        int total = List.of(1, 2, 3, 4).stream()
        // => The stream starts with four integers.
                .filter(number -> number % 2 == 0) // => 2, 4
                // => The odd values 1 and 3 are removed.
                .map(number -> number * 10) // => 20, 40
                // => The surviving values become 20 and 40.
                .reduce(0, Integer::sum); // => 60
                // => The identity 0 and two mapped values produce 60.
        System.out.println(total); // => 60
    }
}
