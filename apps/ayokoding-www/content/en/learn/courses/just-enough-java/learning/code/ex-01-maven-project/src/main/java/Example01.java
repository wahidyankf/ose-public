// The POM next to this source sets the Java release and Maven exec plugin.
public final class Example01 {
    // => The public type name matches Example01.java, so Maven can load it by name.
    public static void main(String[] args) {
        // => The exec goal calls this entry point after the compile goal succeeds.
        System.out.println("This source compiles inside Maven or with javac."); // => The Maven exec goal prints this sentence after compilation.
    }
}
