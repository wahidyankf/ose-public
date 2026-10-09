// => Group the words by their first character.
let counts =
    // => The three words provide two first-letter groups.
    ["apple"; "apricot"; "berry"]
    // => The key is each nonempty word’s first character.
    |> List.groupBy (fun word -> word.[0])
    // => Replace each group with its key and member count.
    |> List.map (fun (letter, words) -> letter, List.length words)
// => This prints [('a', 2); ('b', 1)].
printfn "%A" counts
