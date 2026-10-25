# .NET locked dependencies hello

The unit restores one package from the locked source and prints a fixed line.

**`learning/code/ex-01-hellodotnet/Program.cs`**

```csharp
using Newtonsoft.Json;

var doc = JsonConvert.DeserializeObject<Answer>("{\"Value\":42}");
System.Console.WriteLine($"answer: {doc.Value}");

public sealed class Answer
{
    public int Value { get; set; }
}
```

**Output** (`learning/code/ex-01-hellodotnet/expected/main.stdout.txt`):

```text
answer: 42
```
