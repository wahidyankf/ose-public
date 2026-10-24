// Starter: nested validation. The smell: the real work sits three
// indentations deep and every reader holds every condition to reach it.
// Your task: return each refusal early; keep the happy path flat.
fun greet(name: String?): String { // => the ladder to flatten
    if (name != null) { // => level one: existence
        if (name.isNotBlank()) { // => level two: content
            if (name.length <= 20) { // => level three: size
                return "Hello, " + name + "!" // => the work, buried deep
            } else { // => else branches multiply with nesting
                return "error: too long" // => refusal three, far from its check
            } // => level three ends
        } else { // => refusal two, one level up from its check
            return "error: blank name" // => readers hold two conditions to arrive
        } // => level two ends
    } else { // => refusal one, farthest from its check
        return "error: missing name" // => readers hold everything to arrive
    } // => level one ends: the ladder complete, readability spent
} // => starter ends: correct decisions, exhausting shape

fun main() { // => exercises the ladder, all four rungs
    println(greet("Sari")) // => Hello, Sari!, via three levels
} // => main ends: one call down the ladder
// fix me: guards at the door, happy path flat
