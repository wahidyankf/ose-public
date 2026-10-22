// Example 47: Generic Stack with Bounds.
// The bound lists what the logic needs: Comparable buys ordering,
// so max-first behavior compiles and unorderable callers cannot.
class MaxStack<T : Comparable<T>> { // => the honest list: this stack orders, nothing else
    private val items = mutableListOf<T>() // => private storage: the surface is push, pop, peek

    fun push(item: T) { items.add(item) } // => push accepts anything the bound admits

    fun pop(): T? = items.removeLastOrNull() // => pop answers calmly when empty

    fun peekMax(): T? = items.maxOrNull() // => the bound pays here: ordering guaranteed
} // => misuse cannot compile, so tests cover behavior, not impossibilities

fun main() { // => the entry point the harness runs
    val dues = MaxStack<Int>() // => Int is Comparable: admitted by the bound
    dues.push(50) // => three pushes, unsorted arrival
    dues.push(75) // => the max arrives second
    dues.push(25) // => the min arrives last
    println("max: " + dues.peekMax()) // => Output: max: 75
    println("pop: " + dues.pop()) // => Output: pop: 25, stack order kept
    println("names: " + MaxStack<String>().peekMax()) // => Output: names: null, empty answers calmly
} // => main ends: bounded stack, ordered answers, calm empties
