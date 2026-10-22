// Example 7: Immutable Snapshots with toList.
// toList copies the current contents, so later mutations of the
// original cannot leak into code holding the earlier snapshot.
fun main() { // => the entry point the harness runs
    val roster = mutableListOf("ada", "grace") // => the live list, still changing
    val snapshot = roster.toList() // => freeze this moment: a real copy
    val alias = roster // => no copy: a second name for the same list
    roster.add("sari") // => the live list moves on without asking
    println("live: " + roster) // => Output: live: [ada, grace, sari]
    println("alias: " + alias) // => Output: alias: [ada, grace, sari]
    println("snapshot: " + snapshot) // => Output: snapshot: [ada, grace]
} // => main ends: alias follows, snapshot remembers
