// Example 5: MutableList Grows on Add.
// mutableListOf builds a list under construction: add appends,
// the backing store grows itself, and size always tells the truth.
fun main() { // => the entry point the harness runs
    val queue = mutableListOf("ada") // => mutable on purpose: more names arrive
    println("start: " + queue) // => Output: start: [ada]
    queue.add("grace") // => append: the list grows by one
    queue.add("sari") // => append again: growth needs no ceremony
    println("grown: " + queue + " size=" + queue.size) // => Output: grown: [ada, grace, sari] size=3
    queue.add(1, "budi") // => insert at a position: neighbors shift right
    println("seated: " + queue) // => Output: seated: [ada, budi, grace, sari]
    val frozen = queue.toList() // => freeze when construction ends
    println("frozen: " + frozen) // => Output: frozen: [ada, budi, grace, sari]
} // => main ends: grow, insert, freeze, each printed once
