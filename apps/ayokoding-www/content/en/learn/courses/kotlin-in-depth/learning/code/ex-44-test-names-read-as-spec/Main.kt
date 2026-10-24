// Example 44: Test Names Read as Spec.
// Names state scenario plus verdict in domain words, so the green
// transcript reads as the specification: no correctly, no properly, no works.
fun main() { // => the entry point the harness runs
    val names = mutableListOf<String>() // => the spec sentences bank here in order
    fun spec(sentence: String, holds: Boolean) { // => one sentence, one boolean, one verdict
        check(holds) { "spec broken: " + sentence } // => red names the broken sentence
        names.add(sentence) // => green banks the sentence as specified
        println("PASS: " + sentence) // => Output: each sentence, specified
    } // => the vocabulary stays in dues and ledgers, never mechanics
    spec("settlement of two members totals 125", 50 + 75 == 125) // => scenario plus verdict, plain words
    spec("empty ledger settles zero", emptyMap<String, Int>().values.sum() == 0) // => the edge as a sentence
    spec("unknown member reads as zero dues", (mapOf("sari" to 50)["dewi"] ?: 0) == 0) // => absence as a sentence
    println("specified: " + names.size) // => Output: specified: 3
} // => main ends: three sentences specified, zero mechanics named
