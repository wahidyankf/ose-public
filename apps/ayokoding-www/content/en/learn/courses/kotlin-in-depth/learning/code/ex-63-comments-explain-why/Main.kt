// Example 63: Comments Explain Why.
// Production comments carry business intent: why the rule exists, what
// trap the ordering avoids. Narration of the next line is not a comment.

/**
 * Settles dues with a March grace rule for late payers.
 * @param dues member names to amounts owed, all non-negative.
 * @return the settled total after grace is applied.
 */ // => KDoc: the public promise for readers who never open the file
// => KDoc above documents the contract: promise, params, refusal policy.
// => line comments below carry the business why no signature can state.
fun settleWithGrace(dues: Map<String, Int>): Int { // => the public surface, documented above
    // March grace: collectors skip field visits during the harvest week,
    // so late-March payments count without the late fee. (Policy 7.)
    val grace = 10 // => the grace amount policy 7 grants, named beside its reason
    return dues.values.sum() + grace // => fee waived by rule, not by accident
} // => the why lives beside the number it justifies
// => the transcript proves the rule behaves; the comments prove why it exists.
// => KDoc promises, line comments justify, transcript verifies: three voices.

fun main() { // => the entry point the harness runs
    println("graced: " + settleWithGrace(mapOf("sari" to 50, "budi" to 75))) // => Output: graced: 135
    println("rule: policy-7") // => Output: rule: policy-7
} // => main ends: the why recorded where the number lives
