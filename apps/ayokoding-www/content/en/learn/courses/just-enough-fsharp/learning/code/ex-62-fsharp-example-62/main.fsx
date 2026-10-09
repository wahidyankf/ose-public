// => Both levels are immutable records.
type Address = { City: string; Postcode: string }
// => Customer stores the Address record as a named field.
type Customer = { Name: string; Address: Address }
// => The starting value has Bandung as its city.
let before = { Name = "Ayu"; Address = { City = "Bandung"; Postcode = "40111" } }
// => Copy the address, then copy the containing customer.
let after = { before with Address = { before.Address with City = "Bogor" } }
// => The source and result have different cities.
printfn "%s, %s" before.Address.City after.Address.City
