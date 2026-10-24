// => Example 70: one order line through the full four-layer posture.
module Orders = // => PascalCase module: the naming layer.
    /// <summary>Status text for an order flag; every flag named.</summary> // => docs layer: contract stated.
    type Flag = Shipped | Paid | Pending // => the closed domain: matches stay exhaustive.
    /// <summary>One order line: name, quantity, and status text.</summary> // => contract for the door below.
    let line (name: string) qty flag = // => camelCase door: the naming layer again.
        // => Exhaustive match: the compiler owns domain growth here.
        let status = match flag with Shipped -> "sent" | Paid -> "paid" | Pending -> "waiting" // => all three arms.
        // => Canonical pipeline: source first, one stage per line below.
        [ name; string qty; status ] // => the three pieces as a list.
        |> String.concat " | " // => the formatting layer joins them.
printfn "%s" (Orders.line "engine" 3 Orders.Paid) // => engine | 3 | paid.
