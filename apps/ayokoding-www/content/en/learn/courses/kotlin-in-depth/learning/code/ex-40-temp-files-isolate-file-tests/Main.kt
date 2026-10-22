// Example 40: Temp Files Isolate File Tests.
// createTempFile gives each test a private path that starts absent
// and ends deleted, so crashed runs never poison the next verdicts.
import java.io.File // => the temp file handle, private per run

fun main() { // => the entry point the harness runs
    val tmp = File.createTempFile("dues", ".txt") // => private path: no shared names, no leftovers
    try { // => the test body: red or green, cleanup still runs
        tmp.writeText("sari:50\nbudi:75\n", Charsets.UTF_8) // => write the fixture bytes
        val back = tmp.readText(Charsets.UTF_8) // => read them back through the same charset
        check(back == "sari:50\nbudi:75\n") { "temp roundtrip must preserve bytes" } // => equality is the test
        println("PASS: temp roundtrip preserves bytes") // => Output: content survived both directions
        check(tmp.length() == 16L) { "two lines weigh 16 bytes, got " + tmp.length() } // => size pins the bytes
        println("PASS: two lines weigh 16 bytes") // => Output: size proves no extra bytes
    } finally { // => red or green, the path goes away
        tmp.delete() // => cleanup unconditional: next run starts clean
    } // => isolation complete: nothing shared, nothing left
    println("gone: " + !tmp.exists()) // => Output: gone: true
} // => main ends: private path, proven bytes, unconditional cleanup
