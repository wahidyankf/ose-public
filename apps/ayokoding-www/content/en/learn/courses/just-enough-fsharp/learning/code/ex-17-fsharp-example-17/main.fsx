// => The original record remains available.
type Product = { Name: string; Price: decimal }
// => Keep the original 12.50 price for comparison after the copy.
let original = { Name = "Notebook"; Price = 12.50m }
// => with copies every field except the one named here.
let discounted = { original with Price = 10.00m }
// => The prices are 12.50 and 10.00.
printfn "%M, %M" original.Price discounted.Price
