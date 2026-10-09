// => A record type gives fields fixed names and types.
type Product = { Name: string; Price: decimal }
// => The field labels make construction readable.
let item = { Name = "Notebook"; Price = 12.50m }
// => Dot access reads the named field.
printfn "%s: %M" item.Name item.Price
