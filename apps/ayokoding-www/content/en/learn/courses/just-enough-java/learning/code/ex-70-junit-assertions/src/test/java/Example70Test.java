import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;

final class Example70Test {
    static String label(String name) {
        // => This helper returns a label for valid input.
        if (name.isBlank()) throw new IllegalArgumentException("blank name"); // => space-only input fails
        // => Blank input takes the exceptional path.
        return "task:" + name; // => label("read") is task:read
        // => read becomes task:read.
    }

    @Test
    // => JUnit runs both assertions in one test method.
    void checksSuccessAndFailure() {
        assertEquals("task:read", label("read")); // => checks returned value
        // => The expected label is compared to the helper result.
        assertThrows(IllegalArgumentException.class, () -> label(" ")); // => checks failure type
        // => The lambda delays the invalid call until assertThrows runs it.
        // => The assertion checks exception type, not message.
    }
}
