// => The serializer can read the record's public properties.
type Item = { Name: string; Count: int }
// => Construct a value to cross the JSON boundary.
let item = { Name = "book"; Count = 2 }
// => Serialize those properties into JSON text.
let json = System.Text.Json.JsonSerializer.Serialize item
// => This prints JSON with Name and Count.
printfn "%s" json
