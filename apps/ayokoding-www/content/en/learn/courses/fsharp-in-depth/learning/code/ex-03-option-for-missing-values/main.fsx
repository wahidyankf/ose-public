// => Example 3: Option models absence; map and bind keep it contained.
let nicknames = Map.ofList [ ("ada", "ad") ] // => the fixed table: one known user.
// => TryFind answers Some on a hit and None on a miss, never null.
let found = Map.tryFind "ada" nicknames // => Some "ad": the present case.
// => A miss is data too: None travels the same pipeline as Some.
let missing = Map.tryFind "grace" nicknames // => None: the absent case.
// => map transforms the inside only; None passes through untouched.
let loud = found |> Option.map (fun (s: string) -> s.ToUpperInvariant()) // => Some "AD".
// => bind chains lookups where each step can miss; one None shorts the chain.
let chained = Option.bind (fun n -> Map.tryFind n nicknames) missing // => None stays None.
// => defaultValue answers the fallback exactly once, at the pipeline edge.
let label = Option.defaultValue "anonymous" missing // => the fallback for the miss.
// => Prints prove the hit transformed while the miss fell back cleanly.
printfn "loud=%s chained=%b label=%s" loud.Value chained.IsNone label // => loud=AD chained=true label=anonymous.
