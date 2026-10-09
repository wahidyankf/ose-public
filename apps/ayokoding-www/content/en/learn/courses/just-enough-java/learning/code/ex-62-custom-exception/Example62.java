public final class Example62 {
    static final class InvalidTaskException extends RuntimeException {
        // => The domain-specific type distinguishes this failure.
        InvalidTaskException(String message) { super(message); }
        // => The base exception stores the supplied diagnostic text.
    }
    static void validate(String name) {
        // => Validation completes normally only for nonblank names.
        if (name.isBlank()) throw new InvalidTaskException("blank task name"); // => rejects whitespace
        // => Space-only input satisfies isBlank.
    }
    public static void main(String[] args) {
        try { validate(" "); }
        // => The call fails before control leaves the try block normally.
        catch (InvalidTaskException problem) { System.out.println(problem.getMessage()); } // => blank task name
        // => The handler prints the exception's stored message.
    }
}
