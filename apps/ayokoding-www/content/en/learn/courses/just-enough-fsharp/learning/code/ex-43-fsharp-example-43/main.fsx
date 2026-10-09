// => Address and Customer each name their fields.
type Address = { City: string; Postcode: string }
// => A Customer owns a complete Address value.
type Customer = { Name: string; Address: Address }
// => Construct the nested value explicitly.
let customer = { Name = "Ayu"; Address = { City = "Bandung"; Postcode = "40111" } }
// => Dot access follows the nested fields.
printfn "%s" customer.Address.City
