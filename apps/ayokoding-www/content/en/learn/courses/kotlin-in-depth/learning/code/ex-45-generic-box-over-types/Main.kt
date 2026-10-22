// Example 45: Generic Box over Types.
// One Box<T> carries integers, strings, and instants with the same
// tested code: write once, type per use, fix once instead of thrice.
class Box<T>(var value: T) { // => the unknown named honestly: T stores anything
    fun describe(): String = "box of " + value.toString() // => one logic, every type
} // => unbounded T: storage needs no operations, so no bounds

fun main() { // => the entry point the harness runs
    val dues = Box(50) // => T is Int here: the compiler knows
    val name = Box("sari") // => T is String here: same class, new type
    println(dues.value + 75) // => Output: 125, integers add
    println(name.describe()) // => Output: box of sari
    dues.value = 25 // => mutable box, still Int: the type never wavers
    println("reboxed: " + dues.value) // => Output: reboxed: 25
} // => main ends: one class, two types, zero copies
