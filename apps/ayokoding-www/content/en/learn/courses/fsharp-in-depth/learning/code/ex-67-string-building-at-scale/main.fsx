// => Example 67: three linear renderings of one catalog that agree.
let items = [ for i in 1 .. 100 -> sprintf "item-%03d" i ] // => one hundred fixed items.
// => Join over mapped pieces: the one-shot rendering of an existing list.
let viaJoin = System.String.Join(";", items) // => single pass, separator between.
// => Builder loop: the conditional-append shape for branching code.
let builder = System.Text.StringBuilder() // => one buffer for the whole catalog.
for item in items do builder.Append(item).Append(";") |> ignore // => one append per item.
let viaBuilder = builder.ToString().TrimEnd([|';'|]) // => trailing separator stripped.
// => concat over the pipeline: the functional spelling of the same pass.
let viaConcat = System.String.Concat(items |> List.map (fun s -> s + ";")).TrimEnd([|';'|]) // => mapped then joined.
// => All three agree byte for byte: readability decides, not output.
let same = viaJoin = viaBuilder && viaBuilder = viaConcat // => true: one text, three roads.
printfn "same=%b chars=%d" same viaJoin.Length // => same=true chars=899.
