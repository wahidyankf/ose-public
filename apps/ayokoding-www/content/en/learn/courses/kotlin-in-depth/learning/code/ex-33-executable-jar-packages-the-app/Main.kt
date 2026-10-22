// Example 33: Executable Jar Packages the App.
// -include-runtime merges code and stdlib into one shippable jar;
// args arrive as strings and type at the boundary, never deeper.
fun main(args: Array<String>) { // => the shell hands names in here
    val ledger = mapOf("sari" to 50, "budi" to 75, "citra" to 25) // => fixed dues table
    val named = if (args.isEmpty()) ledger.keys.sorted() else args.sorted() // => no args means everyone
    var total = 0 // => the running settlement, starting at zero
    for (member in named) { // => each named member settles in sorted order
        val dues = ledger[member] ?: 0 // => unknown names read as zero, calmly
        println(member + ": " + dues) // => Output: one line per member, sorted
        total += dues // => accumulate the printed figure
    } // => the loop ends: named members settled, total banked
    println("total: " + total) // => Output: the grand total of exactly the named
} // => main ends: args typed at entry, report printed, jar shippable
