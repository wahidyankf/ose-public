import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

final class Example69Test {
    static int add(int left, int right) { return left + right; } // => add(2, 3) is 5
    // => The method has no shared state or side effects.

    @Test // => JUnit discovers this method
    // => JUnit invokes addsTwoNumbers as a test.
    void addsTwoNumbers() {
        assertEquals(5, add(2, 3)); // => expected 5, actual 5
        // => The first argument is expected and the second is actual.
        // => Changing add's arithmetic would make this assertion fail.
    }
}
