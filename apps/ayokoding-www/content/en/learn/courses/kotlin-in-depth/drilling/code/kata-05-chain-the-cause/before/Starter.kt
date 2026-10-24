// Starter: the swallowed cause. The smell: the file error becomes a
// ledger message with no chain, so debuggers guess at the root.
// Your task: chain the cause; print both messages to prove it.
import java.io.File // => the file layer that reports first

class LedgerException(message: String) : Exception(message) // => no cause slot: the story ends here

fun loadLedger(path: String): String { // => translates file failures upward
    try { // => the file operation that can disappoint
        return File(path).readText(Charsets.UTF_8) // => missing fixture throws below
    } catch (e: Exception) { // => caught, then orphaned on the next line
        throw LedgerException("cannot settle " + path) // => the cause dropped: diagnosis guesses now
    } // => translation without receipt: the smell, one line
} // => starter ends: layer message only, root lost

fun main() { // => walks a chain that is not there
    try { // => the transcript tries to walk the chain
        loadLedger("no-such-ledger.txt") // => missing fixture, as designed
    } catch (e: LedgerException) { // => the ledger language arrives, alone
        println("ledger: " + e.message) // => the outer story, half the truth
    } // => main ends: one story where two belong
} // => fix me: chain the cause, walk both messages
