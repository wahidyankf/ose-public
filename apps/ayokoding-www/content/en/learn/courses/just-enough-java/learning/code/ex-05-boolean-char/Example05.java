public final class Example05 {
    public static void main(String[] args) {
        boolean ready = true; // => a two-valued condition
        // => The left side of && evaluates to true.
        char grade = 'A';     // => one UTF-16 code unit
        // => The comparison to 'A' also evaluates to true.
        System.out.println(ready && grade == 'A'); // => true
    }
}
