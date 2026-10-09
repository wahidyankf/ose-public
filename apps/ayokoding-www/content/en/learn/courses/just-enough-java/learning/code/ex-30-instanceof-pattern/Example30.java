public final class Example30 {
    public static void main(String[] args) {
        Object value = "java"; // => value holds a String even though its declared type is Object.
        // => The declared Object type permits many runtime values.
        if (value instanceof String text) { // => text is in scope on match
        // => The match both checks String and binds text.
            System.out.println(text.toUpperCase()); // => JAVA
        }
    }
}
