// => Example 18: four library calls normalize one messy line.
let messy = "  ada ,  LOVELACE,analytical engine  " // => fixed input: uneven spacing, mixed case.
// => Split on commas, dropping empties so doubled separators vanish.
let parts = messy.Split([|','|], System.StringSplitOptions.RemoveEmptyEntries) // => three raw pieces.
// => Trim each piece, then normalize case with the invariant culture.
let clean = parts |> Array.map (fun p -> p.Trim().ToUpperInvariant()) // => [|ADA; LOVELACE; ANALYTICAL ENGINE|].
// => Join rebuilds one line with a single canonical separator.
let line = System.String.Join(" | ", clean) // => ADA | LOVELACE | ANALYTICAL ENGINE.
// => Count proves nothing was lost: three pieces in, three pieces out.
printfn "%s (%d parts)" line clean.Length // => ADA | LOVELACE | ANALYTICAL ENGINE (3 parts).
