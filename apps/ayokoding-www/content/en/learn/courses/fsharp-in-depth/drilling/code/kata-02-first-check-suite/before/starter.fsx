// => Kata 2 starter: a discount function with no tests pinning it.
let discount total = if total > 100 then total * 9 / 10 else total // => the untested rule.
// => The function works; nothing proves it stays working.
printfn "large=%d small=%d" (discount 200) (discount 50) // => 180 and 50, unpinned.
