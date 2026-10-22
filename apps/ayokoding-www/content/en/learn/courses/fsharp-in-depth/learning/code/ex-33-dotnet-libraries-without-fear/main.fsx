// => Example 33: three boundary crossings that agree with each other.
open System.Linq // => LINQ's Enumerable joins the vocabulary here.
// => StringBuilder appends lines without intermediate string garbage.
let builder = System.Text.StringBuilder() // => the mutable buffer, local only.
builder.AppendLine("ada") |> ignore // => first line appended, builder returned.
builder.AppendLine("grace") |> ignore // => second line appended the same way.
// => LINQ ranges and filters from the C# side of the same runtime.
let evens = Enumerable.Range(1, 6).Where(fun n -> n % 2 = 0).ToArray() // => [|2; 4; 6|].
// => ResizeArray is List<'T>: mutate locally, freeze to an F# list at the edge.
let flex = System.Collections.Generic.List<string>() // => the mutable list, local only.
flex.Add("lin") // => staged inside the boundary, converted below.
let frozen = flex |> Seq.toList // => frozen F# list leaves the edge.
printfn "lines=%d evens=%A frozen=%A" (builder.ToString().Split([|'\n'|], System.StringSplitOptions.RemoveEmptyEntries).Length) evens frozen // => lines=2 evens=[|2; 4; 6|] frozen=["lin"].
