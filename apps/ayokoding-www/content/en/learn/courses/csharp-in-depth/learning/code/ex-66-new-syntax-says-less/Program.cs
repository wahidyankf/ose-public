// => Example 66: New Syntax Says Less.
// => Target-typed new, collection expressions, and raw strings cut the noise.
List<string> menu = ["rice", "rendang", "sambal"]; // => collection expression: no new, no braces tax
Dictionary<string, int> prices = new() // => target-typed new: the type sits on the left
{
    ["rice"] = 12000, // => the price the receipt below multiplies
    ["rendang"] = 25000, // => the price the receipt below multiplies
    ["sambal"] = 5000, // => the last item needs its price too
};

// => raw string literal: quotes and backslashes need no escaping inside
string sign = """The "warung" opens at 09:00"""; // => triple quotes hold the inner quotes
Console.WriteLine(sign); // => Output: The "warung" opens at 09:00

// => index from end: ^1 names the last item without counting the length
Console.WriteLine($"{menu[^1]} costs {prices[menu[^1]]}"); // => Output: sambal costs 5000
