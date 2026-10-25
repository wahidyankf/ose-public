// Example 75: CLI Anatomy Flags and Exits.
// Parse flags into a config, act once, exit with the contract code:
// zero settled, one usage error, two broken data. Anatomy in that order.
data class Config(val member: String?, val limit: Int) // => parsed flags live here, nowhere else

fun parseFlags(args: Array<String>): Config { // => parsing: strings into typed config
    var member: String? = null // => no flag means everyone: the documented default
    var limit = 10 // => default limit, stated beside the variable
    var i = 0 // => index walk: flags take values from the next slot
    while (i < args.size) { // => every argument classified exactly once
        when (args[i]) { // => one arm per flag: the CLI vocabulary
            "--member" -> { member = args.getOrNull(i + 1); i += 2 } // => value flag consumes two slots
            "--limit" -> { limit = args.getOrNull(i + 1)?.toIntOrNull() ?: 10; i += 2 } // => calm digits, defaulted
            else -> { println("usage: settle [--member NAME] [--limit N]"); kotlin.system.exitProcess(1) } // => bad flag: usage plus exit one
        } // => unknown flags refuse loudly instead of being ignored
    } // => the walk ends: every flag parsed or refused
    return Config(member, limit) // => typed config out: acting code never sees strings
} // => parsing ends: the wall between shell text and program logic

fun main(args: Array<String>) { // => the entry point the harness runs twice
    val cfg = parseFlags(args) // => parse first, always
    println("member: " + (cfg.member ?: "everyone")) // => Output: the selected member or the default
    println("limit: " + cfg.limit) // => Output: the limit, defaulted or flagged
} // => main ends: parse, act, exit; flags aloud, codes contracted
