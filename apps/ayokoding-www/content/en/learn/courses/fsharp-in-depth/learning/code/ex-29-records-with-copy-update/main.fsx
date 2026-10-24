// => Example 29: a book record revised twice; every edition survives.
type Book = { Title: string; Year: int; Price: float } // => the named shape, fields typed.
// => The first edition: all three fields named at construction.
let first = { Title = "Engines"; Year = 1843; Price = 25.0 } // => edition one.
// => with answers a new record: price changed, title and year shared.
let second = { first with Price = 29.5 } // => edition two: repriced.
// => Updates chain: each edition derives from the previous, originals intact.
let third = { second with Year = 1844 } // => edition three: corrected year.
// => Structural equality: separately built, field-identical copies match.
let twin = { Title = "Engines"; Year = 1843; Price = 25.0 } // => a twin of edition one.
printfn "twin=%b third=%s/%d/%.2f first=%s" (twin = first) third.Title third.Year third.Price first.Title // => twin=true third=Engines/1844/29.50 first=Engines.
