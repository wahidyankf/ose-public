// => Kata 8 solution: the collection question asked directly.
let names = [ "ada"; "grace"; "lin"; "hopper" ] // => the same fixed roster.
// => Name the question first — how many pass a predicate — and the function follows.
let long = names |> List.filter (fun s -> s.Length > 3) |> List.length // => the question, stated.
// => Same transcript as the starter: the accent left, the count stayed.
printfn "long=%d" long // => long=3, counted idiomatically.
