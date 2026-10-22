// => Kata 3 starter: a hand-rolled total with a loop and a mutable cell.
let names = [ "ada"; "grace"; "lin" ] // => the fixed roster under test.
// => The manual loop: index, accumulate, repeat — the library already does this.
let mutable total = 0 // => the accumulator the loop feeds.
for name in names do total <- total + name.Length // => add each length by hand.
// => The loop works; the library answers the same number in one call.
printfn "total=%d" total // => total=12, unpinned to any contract.
