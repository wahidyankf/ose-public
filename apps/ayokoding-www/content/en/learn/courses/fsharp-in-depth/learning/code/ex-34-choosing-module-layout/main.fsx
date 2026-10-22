// => Example 34: loose functions versus one module; same answers, smaller promise.
let discount q = if q >= 10 then 0.9 else 1.0 // => loose helper one: bulk rate.
let looseTotal q p = float q * p * discount q // => loose total: helper exposed.
// => The module version hides the helper and exposes one door.
module Catalog = // => the packaged version of the same logic.
    // => Same helper, now private: callers cannot lean on it.
    let private rate q = if q >= 10 then 0.9 else 1.0 // => hidden bulk rate.
    // => The one public promise of this module.
    let total q p = float q * p * rate q // => packaged total.
// => Both spellings agree on both orders: layout changed, math did not.
let a = looseTotal 12 10.0 = Catalog.total 12 10.0 // => bulk agrees.
let b = looseTotal 3 10.0 = Catalog.total 3 10.0 // => small agrees.
printfn "bulk-same=%b small-same=%b" a b // => bulk-same=true small-same=true.
