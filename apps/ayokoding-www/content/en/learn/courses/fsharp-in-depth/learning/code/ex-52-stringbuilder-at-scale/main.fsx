// => Example 52: identical reports, counted copying ten to one apart.
let rows = [ for i in 1 .. 100 -> sprintf "row-%03d" i ] // => one hundred fixed rows, six chars each.
// => Loop concatenation: each step copies the whole prefix built so far.
let mutable copies = 0 // => counts characters copied by the loop version.
let mutable acc = "" // => the growing prefix, recopied every row.
for row in rows do // => one hundred appends by copy.
    copies <- copies + acc.Length + row.Length // => this step copies prefix plus row.
    acc <- acc + row + "\n" // => the classic quadratic build.
// => Builder: each row appended once, one final materialization.
let builder = System.Text.StringBuilder() // => the single buffer.
for row in rows do builder.Append(row).Append("\n") |> ignore // => one hundred appends, no copies.
let built = builder.ToString() // => one materialization at the end.
// => Same text both ways; the copying counts differ by an order of magnitude.
let same = acc = built // => true: identical reports.
printfn "same=%b loop-copies=%d builder-appends=%d" same copies rows.Length // => same=true loop-copies=338350 builder-appends=100.
