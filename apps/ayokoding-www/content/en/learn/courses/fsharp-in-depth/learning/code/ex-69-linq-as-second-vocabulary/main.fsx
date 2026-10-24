// => Example 69: one honors question answered in F# and in LINQ.
open System.Linq // => Where, Select, and ToList join here.
let roster = [ ("ada", 95); ("grace", 88); ("lin", 72) ] // => the fixed table both sides read.
// => Native spelling: filter then map through the F# vocabulary.
let native = roster |> List.filter (fun (_, s) -> s >= 80) |> List.map fst |> List.sort // => [ada; grace].
// => Boundary spelling: the same question through LINQ over the same list.
let boundary = // => Where then Select, converted once at the edge.
    roster.Where(fun (_, s) -> s >= 80).Select(fun (n, _) -> n).OrderBy(fun n -> n) // => same two names.
    |> Seq.toList // => cross the edge back into F# lists.
// => Both vocabularies agree: the seam is thin and the answers match.
let same = native = boundary // => true: one question, two spellings.
printfn "native=%A same=%b" native same // => native=["ada"; "grace"] same=true.
