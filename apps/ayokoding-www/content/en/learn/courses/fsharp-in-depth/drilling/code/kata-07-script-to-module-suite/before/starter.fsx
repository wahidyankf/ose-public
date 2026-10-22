// => Kata 7 starter: loose bindings compute with nothing pinning them.
let qty = 12 // => the fixed quantity, floating at top level.
let rate = if qty >= 10 then 0.9 else 1.0 // => the bulk rule, also floating.
let total = float qty * 10.0 * rate // => the total, computed once, unpinned.
// => The script prints; nothing proves it stays right.
printfn "total=%.2f" total // => total=108.00, claimed not checked.
