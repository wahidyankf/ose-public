// => Example 76: Read JSON Attributes as Contract.
// => JsonPropertyName maps fields to wire names: read the attributes as the contract.
var ticket = new Ticket { Dish = "rendang", Qty = 2 }; // => the object the wire must carry

// => Serialize honors the attributes: dish_name and qty travel, not Dish and Qty
string json = System.Text.Json.JsonSerializer.Serialize(ticket); // => the contract rendered
Console.WriteLine(json); // => Output: {"dish_name":"rendang","qty":2}

// => the attributes below are the contract: rename them and the wire changes
sealed class Ticket // => sealed: the contract shape ends here
{
    [System.Text.Json.Serialization.JsonPropertyName("dish_name")] // => wire name, not field name
    public string Dish { get; set; } = ""; // => the field the attribute renames

    [System.Text.Json.Serialization.JsonPropertyName("qty")] // => short wire name for quantity
    public int Qty { get; set; } // => the field the attribute shortens
}
