// => Example 72: an async block read as awaits, computes, and delivery.
let fetchRate () = async { return 0.9 } // => awaited stage: the discount rate.
let fetchQty () = async { return 12 } // => awaited stage: the quantity.
// => The block below mixes awaits with plain computes; read the kinds apart.
let plan = async { // => the staged plan, cold until run.
    // => Await kind: these lines pause the workflow for a stage.
    let! rate = fetchRate () // => await one: rate arrives here.
    let! qty = fetchQty () // => await two: quantity arrives here.
    // => Compute kind: plain synchronous math on bound values.
    let total = float qty * 10.0 * rate // => compute: no awaiting inside.
    // => Delivery kind: the workflow's answer leaves here.
    return total } // => deliver: one number out.
// => Running the classified plan prints the computed total.
printfn "total=%.2f" (Async.RunSynchronously plan) // => total=108.00.
