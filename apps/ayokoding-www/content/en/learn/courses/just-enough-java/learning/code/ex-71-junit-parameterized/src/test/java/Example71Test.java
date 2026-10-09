import static org.junit.jupiter.api.Assertions.assertFalse;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

final class Example71Test {
    static boolean valid(String name) { return !name.isBlank(); } // => empty, space, tab are false
    // => Whitespace-only strings are invalid by this rule.

    @ParameterizedTest
    // => JUnit repeats the method for each supplied value.
    @ValueSource(strings = {"", " ", "\t"}) // => three test invocations
    // => The inputs cover empty, space-only, and tab-only text.
    void rejectsBlankNames(String name) {
        // => Each invocation receives one value as name.
        assertFalse(valid(name)); // => runs once for each ValueSource input
        // => All three inputs must produce false.
        // => A future validation change that accepts one input fails that invocation.
    }
}
