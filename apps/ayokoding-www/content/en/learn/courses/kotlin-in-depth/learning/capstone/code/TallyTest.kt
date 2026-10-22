// TallyTest.kt: the thirteen-check suite for the capstone domain.
// Runs under the plain toolchain: check plus PASS lines, no framework.
// Green means the domain honors every contract below; red names the break.
fun main() { // => the suite entry point the harness runs
    var failed = 0 // => broken contracts bank here with their names
    fun checkThat(name: String, holds: Boolean) { // => one contract, one verdict
        if (holds) println("PASS: " + name) // => green states the contract it proves
        else { println("FAIL: " + name); failed++ } // => red names the broken contract
    } // => every contract answers exactly once
    checkThat("parses a good line", parseLine("sari:50") == Due("sari", 50)) // => the happy shape
    checkThat("refuses lines without a colon", parseLine("oops") == null) // => shapeless refused
    checkThat("refuses blank members", parseLine(":40") == null) // => nameless refused
    checkThat("refuses wordy amounts", parseLine("dewi:xx") == null) // => unparsable refused
    checkThat("refuses negative dues", parseLine("sari:-5") == null) // => minus is a data error
    val summary = summarize(listOf("sari:50", "oops", "budi:75", "", "sari:25")) // => three good, two bad
    checkThat("totals per member", summary.totals == mapOf("budi" to 75, "sari" to 75)) // => accumulated, not last-wins
    checkThat("counts skips honestly", summary.skipped == 2) // => refusals counted, never hidden
    checkThat("sorts members for stability", summary.totals.keys.toList() == listOf("budi", "sari")) // => byte-stable order
    val text = render(summary) // => the report for the folded fixture
    checkThat("renders member lines", "budi: 75\n" in text && "sari: 75\n" in text) // => each member printed once
    checkThat("renders the grand total", "grand: 150\n" in text) // => grand covers exactly the settled
    checkThat("renders the skip count", "skipped: 2\n" in text) // => skips printed, never vanished
    checkThat("empty input settles zero", render(summarize(emptyList())) == "grand: 0\nskipped: 0\n") // => the empty edge
    checkThat("all-bad input skips all", summarize(listOf("oops", "xx")) == Summary(emptyMap(), 2)) // => nothing settled, all counted
    println("checks: 14 failed: " + failed) // => the suite verdict: fourteen contracts, named failures
    if (failed > 0) error("red: capstone domain broken") // => nonzero exit when anything failed
} // => suite ends: fourteen contracts, fourteen verdicts, exit agrees
