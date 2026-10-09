var item = new Item(); // => Name starts as an empty string
item.Name = "Review"; // => Name now stores Review on the same object
Console.WriteLine(item.Name); // => Output: Review

class Item // => declares the item type
{
    public string Name { get; set; } = ""; // => getter and setter store the assigned name
}
