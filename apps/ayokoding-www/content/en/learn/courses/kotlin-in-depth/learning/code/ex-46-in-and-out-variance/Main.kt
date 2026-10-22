// Example 46: In and Out Variance.
// out positions produce so baskets substitute upward; in positions
// consume so sinks substitute downward. Both directions, one keyword each.
open class Member(val name: String) // => the base: every roster entry is one
class Citra : Member("citra") // => one subtype for the substitution proof

class Basket<out T>(val item: T) { // => out: produces T, never consumes it
    fun contents(): String = "basket holds one item" // => reading flows outward
} // => Basket<Citra> serves wherever Basket<Member> is expected

class Sink<in T> { // => in: consumes T, never produces it
    fun accept(item: T): String = "sank one item" // => writing flows inward
} // => Sink<Member> serves wherever Sink<Citra> is expected

fun main() { // => the entry point the harness runs
    val basket: Basket<Member> = Basket(Citra()) // => upward substitution: safe, compiles
    println(basket.contents()) // => Output: basket holds one item
    val sink: Sink<Citra> = Sink<Member>() // => downward substitution: safe, compiles
    println(sink.accept(Citra())) // => Output: sank one item
    println("variance: both directions compile") // => Output: the substitution verdict
} // => main ends: producers up, consumers down, invariants stay put
