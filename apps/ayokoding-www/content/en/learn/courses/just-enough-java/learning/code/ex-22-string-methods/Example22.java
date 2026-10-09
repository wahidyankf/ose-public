public final class Example22 {
    public static void main(String[] args) {
        String padded = "  Java  "; // => padded retains two spaces on each side.
        // => The source value has eight characters including spaces.
        String clean = padded.strip().toLowerCase(); // => "java"
        // => strip removes the outer spaces before lowercase conversion.
        System.out.println(clean.length()); // => 4
    }
}
