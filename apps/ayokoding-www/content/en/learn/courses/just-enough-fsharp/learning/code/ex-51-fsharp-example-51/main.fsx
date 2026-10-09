// => System.Collections.Generic.Dictionary is a .NET type.
let counts = System.Collections.Generic.Dictionary<string, int>()
// => Indexer assignment stores one entry.
counts.["tea"] <- 2
// => TryGetValue returns a success flag and value.
let found, value = counts.TryGetValue "tea"
// => This prints true, 2.
printfn "%b, %d" found value
