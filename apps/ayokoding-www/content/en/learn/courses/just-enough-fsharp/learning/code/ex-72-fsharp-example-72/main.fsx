// => DateOnly is a .NET value type.
let date = System.DateOnly(2026, 10, 9)
// => AddDays returns a new date value.
let next = date.AddDays 1
// => ISO formatting produces 2026-10-10.
printfn "%s" (next.ToString("yyyy-MM-dd"))
