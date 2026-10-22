// => Example 49: an order revised twice; all three stages print.
type Order = { Items: int; Discount: float; Shipped: bool } // => the order shape.
// => Stage one: items added, no discount, not shipped.
let placed = { Items = 3; Discount = 1.0; Shipped = false } // => the placed order.
// => Stage two: bulk discount applied, everything else shared.
let priced = { placed with Discount = 0.9 } // => the priced order.
// => Stage three: shipped flag set on top of the priced revision.
let sent = { priced with Shipped = true } // => the shipped order.
// => All three stages print: history survived because nothing mutated.
let show o = sprintf "%d/%.1f/%b" o.Items o.Discount o.Shipped // => one-line order renderer.
printfn "%s %s %s" (show placed) (show priced) (show sent) // => 3/1.0/false 3/0.9/false 3/0.9/true.
