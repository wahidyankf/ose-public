// Solution: guards at the door. Each refusal returns immediately, so
// the happy path sits at the margin with no nesting around the work.
// Fixed from Starter: the ladder became three exits plus one greeting.
fun greet(name: String?): String { // => flat by construction, not by care
    if (name == null) return "error: missing name" // => refusal one, at the door
    if (name.isBlank()) return "error: blank name" // => refusal two, at the door
    if (name.length > 20) return "error: too long" // => refusal three, at the door
    return "Hello, " + name + "!" // => the work, flat and obvious
} // => helper ends: three exits, one greeting, zero nesting

fun main() { // => the entry point the harness runs
    println(greet(null)) // => Output: error: missing name
    println(greet("   ")) // => Output: error: blank name
    println(greet("Sari")) // => Output: Hello, Sari!
} // => main ends: every refusal and the success, each flat
