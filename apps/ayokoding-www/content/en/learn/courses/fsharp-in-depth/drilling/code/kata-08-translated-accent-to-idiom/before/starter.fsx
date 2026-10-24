// => Kata 8 starter: an index loop wearing another language's accent.
let names = [ "ada"; "grace"; "lin"; "hopper" ] // => the fixed roster.
// => Manual indexing walks the list like an array in another language.
let mutable long = 0 // => the counter the index loop feeds.
for i = 0 to names.Length - 1 do // => index loop over a linked list.
    let name = names.[i] // => index back into the list each time.
    if name.Length > 3 then long <- long + 1 // => count the long names.
// => The loop works; the pipeline below asks the question directly.
printfn "long=%d" long // => long=3, counted with an accent.
