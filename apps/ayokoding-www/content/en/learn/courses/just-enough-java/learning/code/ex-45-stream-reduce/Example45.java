import java.util.List;
public final class Example45 {
    public static void main(String[] args) {
        int total = List.of(4, 7, 9).stream() // => The stream supplies 4, 7, and 9 to the reduction.
        // => No sum is computed until reduce terminates the stream.
                .reduce(0, Integer::sum); // => identity 0 and accumulator
                // => The accumulator combines 0 + 4 + 7 + 9.
        System.out.println(total); // => 20
        // => The identity zero does not change the result.
    }
}
