public final class Example67 {
    public static void main(String[] args) {
        Object task = new Object(); // => reachable through task
        Object alias = task;        // => second reference to same object
        // => task and alias compare identical by reference.
        task = null;                // => object still reachable through alias
        // => Clearing one reference does not clear the other.
        System.out.println(alias != null); // => true; alias still references the object
        // This does not promise when, or whether, garbage collection runs.
    }
}
