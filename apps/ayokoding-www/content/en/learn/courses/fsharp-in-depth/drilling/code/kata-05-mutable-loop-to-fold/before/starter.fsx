// => Kata 5 starter: a mutable counter walks the scores by hand.
let scores = [ 72; 95; 58; 88 ] // => the fixed roster under test.
// => The manual count: a cell plus a loop where a fold belongs.
let mutable passing = 0 // => the counter the loop feeds.
for s in scores do // => walk every score by hand.
    if s >= 60 then passing <- passing + 1 // => count the passers one by one.
// => The loop works; the fold below answers the same count immutably.
printfn "passing=%d" passing // => passing=3, counted mutably.
