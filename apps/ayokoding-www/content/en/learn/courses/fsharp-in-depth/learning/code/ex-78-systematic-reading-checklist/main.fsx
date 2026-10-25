// => Example 78: five reading passes over one discount pipeline.
let orders = [ ("ada", 12); ("lin", 3) ] // => purpose: bulk-discount two orders.
// => Shapes: string-and-int pairs in, string summaries out.
let rate qty = if qty >= 10 then 0.9 else 1.0 // => flow: the bulk rule decides.
// => Flow: map each order through rate and total in one pass.
let lines = orders |> List.map (fun (name, qty) -> sprintf "%s:%.2f" name (float qty * 10.0 * rate qty)) // => two lines.
// => Failures: none — pure math on fixed data, no exits to map.
let summary = System.String.Join("; ", lines) // => summary: the tell-a-colleague line.
printfn "%s" summary // => ada:108.00; lin:30.00.
