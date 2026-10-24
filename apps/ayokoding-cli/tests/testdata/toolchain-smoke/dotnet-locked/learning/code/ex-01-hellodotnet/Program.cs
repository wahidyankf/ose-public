using Newtonsoft.Json;

var doc = JsonConvert.DeserializeObject<Answer>("{\"Value\":42}");
System.Console.WriteLine($"answer: {doc.Value}");

public sealed class Answer
{
    public int Value { get; set; }
}
