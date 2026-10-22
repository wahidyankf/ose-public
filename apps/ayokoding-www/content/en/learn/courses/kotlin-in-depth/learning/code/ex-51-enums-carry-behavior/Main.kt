// Example 51: Enums Carry Behavior.
// Each tier owns its rate as a function, so callers never branch on
// tier names and rate changes touch one file in exactly one place.
enum class Tier { // => the fixed set of settlement tiers
    STANDARD { // => each constant implements the rule itself
        override fun rate(): Double = 1.0 // => full rate: no discount, no fee
    }, // => comma between constants, semicolon after the last
    PROMPT { // => early settlers earn their discount here
        override fun rate(): Double = 0.9 // => ten percent off, computed at the constant
    }, // => the rule lives beside the name it belongs to
    LATE { // => late settlers pay the fee where the tier is declared
        override fun rate(): Double = 1.1 // => ten percent on, no external when needed
    }; // => semicolon ends the constants, members follow

    abstract fun rate(): Double // => every tier must state its rate: no rate, no tier
} // => adding a tier without a rate refuses to compile

fun main() { // => the entry point the harness runs
    println("standard: " + (100 * Tier.STANDARD.rate())) // => Output: standard: 100.0
    println("prompt: " + (100 * Tier.PROMPT.rate())) // => Output: prompt: 90.0
    println("late: " + (100 * Tier.LATE.rate())) // => Output: late: 110.0
    println("tiers: " + Tier.entries.size) // => Output: tiers: 3
} // => main ends: behavior rode with the constants, callers branched on nothing
