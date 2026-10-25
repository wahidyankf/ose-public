// => Example 66: a struct snapshot survives its source moving on.
[<Struct>] type Point = { X: int; Y: int } // => value semantics: copies, never aliases.
// => The reader snapshots its argument by receiving it: copies happen at the call.
let readPoint (p: Point) = sprintf "%d,%d" p.X p.Y // => the snapshot rendered.
// => Source advances after the snapshot: aliasing would corrupt the print.
let before = { X = 1; Y = 2 } // => the original coordinates.
let snapshot = readPoint before // => snapshot taken while source is old.
let after = { before with X = 9 } // => source moves on; snapshot unaffected.
printfn "snapshot=%s now=%s" snapshot (readPoint after) // => snapshot=1,2 now=9,2.
