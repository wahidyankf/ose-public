// Example 3: Early Returns Flatten Nesting.
// Guard clauses return failures at the door, so the happy path
// stays at the margin with no nesting around the real work.
fun greet(name: String?): String { // => nullable input: absence is possible
    if (name == null) { // => cheapest, most fundamental check first
        return "error: missing name" // => refusal one: exit immediately
    } // => past this line the compiler knows name is not null
    if (name.isBlank()) { // => whitespace-only is the realistic hostile input
        return "error: blank name" // => refusal two: exit immediately
    } // => past this line the name carries real text
    return "Hello, " + name + "!" // => the happy path, flat and obvious
} // => deciding lives in the helper, printing lives in main

fun main() { // => the entry point the harness runs
    println(greet(null)) // => Output: error: missing name
    println(greet("   ")) // => Output: error: blank name
    println(greet("Sari")) // => Output: Hello, Sari!
} // => main ends: each refusal and the success each print once
