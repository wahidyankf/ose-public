var item = new Item { Id = 7 }; // => allowed at construction
Console.WriteLine(item.Id); // => Output: 7

class Item // => declares the item type
{
    public int Id { get; init; } // => Id can be set during initialization
}
