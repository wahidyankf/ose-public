// Solution: translation with receipt. The ledger message names the
// layer, the chained cause names the root: two stories, one throw.
// Fixed from Starter: the orphaned cause travels again.
import java.io.File // => the file layer that reports first

class LedgerException(message: String, cause: Throwable?) : Exception(message, cause) // => the cause slot restored

fun loadLedger(path: String): String { // => translates file failures upward, receipt kept
    try { // => the file operation that can disappoint
        return File(path).readText(Charsets.UTF_8) // => missing fixture throws below
    } catch (e: Exception) { // => caught, then chained on the next line
        throw LedgerException("cannot settle " + path, e) // => both stories travel now
    } // => translation with receipt: the fix, one argument
} // => callers catch LedgerException and still reach the file error

fun main() { // => the entry point the harness runs
    try { // => the transcript walks the chain on purpose
        loadLedger("no-such-ledger.txt") // => missing fixture: the file layer complains
    } catch (e: LedgerException) { // => the ledger language arrives with its root
        println("ledger: " + e.message) // => Output: ledger: cannot settle no-such-ledger.txt
        println("cause: " + (e.cause?.javaClass?.simpleName ?: "none")) // => Output: cause: FileNotFoundException
    } // => both layers named, the story complete
} // => main ends: translation with the receipt kept
