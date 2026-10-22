// Example 15: Exceptions Carry Causes.
// Translating across layers keeps both stories: the outer message
// for the catching layer, the chained cause for whoever debugs it.
import java.io.File // => the file layer that reports first

class LedgerException(message: String, cause: Throwable?) : Exception(message, cause) // => one type, cause chained

fun loadLedger(path: String): String { // => the ledger layer speaks dues, not bytes
    try { // => the file operation that can disappoint lives here
        return File(path).readText(Charsets.UTF_8) // => missing file throws below
    } catch (e: Exception) { // => catch the layer language, translate it up
        throw LedgerException("cannot settle " + path, e) // => outer message plus the original cause
    } // => the chain stays unbroken: no swallowed stories
} // => callers catch LedgerException and still reach the file error

fun main() { // => the entry point the harness runs
    try { // => the transcript walks the chain on purpose
        loadLedger("no-such-ledger.txt") // => missing fixture: the file layer complains
    } catch (e: LedgerException) { // => the ledger language arrives here
        println("ledger: " + e.message) // => Output: ledger: cannot settle no-such-ledger.txt
        println("cause: " + (e.cause?.javaClass?.simpleName ?: "none")) // => Output: cause: FileNotFoundException
    } // => both layers named, the story complete
} // => main ends: translation with the receipt kept
