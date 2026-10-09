// => Each name aligns with one score by position.
let names = ["Ayu"; "Budi"]
// => Both scores align positionally with the two names.
let scores = [8; 9]
// => List.zip creates a pair for each position.
let rows = List.zip names scores
// => This prints [("Ayu", 8); ("Budi", 9)].
printfn "%A" rows
