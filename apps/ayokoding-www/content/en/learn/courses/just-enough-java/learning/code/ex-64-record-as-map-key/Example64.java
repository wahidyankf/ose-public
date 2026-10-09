import java.util.Map;
public final class Example64 {
    record Coordinate(int x, int y) {}
    // => The generated equals and hashCode use both coordinates.
    public static void main(String[] args) {
        Map<Coordinate, String> labels = Map.of(new Coordinate(2, 3), "desk"); // => record key uses its components
        // => The stored key has x=2 and y=3.
        System.out.println(labels.get(new Coordinate(2, 3))); // => desk; record value key
        // => The lookup creates a separate but equal key object.
        // => The matching hash and equality locate desk.
    }
}
