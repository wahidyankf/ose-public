var card = new Card { Title = "Inbox" }; // => initializer stores Inbox in the new Card
Console.WriteLine(card.Title); // => Output: Inbox

class Card // => defines the mutable Card model
{
    public string Title { get; set; } = ""; // => property starts as an empty string
}
