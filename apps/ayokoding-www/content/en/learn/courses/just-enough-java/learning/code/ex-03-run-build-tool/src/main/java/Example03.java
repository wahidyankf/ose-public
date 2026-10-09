// Run this class with the local Maven exec goal or directly with javac and java.
public final class Example03 {
    // => Maven compiles this named class from the conventional source directory.
    public static void main(String[] args) {
        // => The exec goal invokes main only after the source has compiled.
        System.out.println("Build and run both reached main."); // => Maven reached main after its compile phase.
    }
}
