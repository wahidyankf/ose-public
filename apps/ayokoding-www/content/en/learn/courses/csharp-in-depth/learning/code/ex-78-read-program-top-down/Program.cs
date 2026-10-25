// => Example 78: Read Program Top Down.
// => Read a whole program top-down: entry, verbs, helpers, then types at the foot.
Console.WriteLine(Run("menu")); // => Output: rice, rendang, sambal
Console.WriteLine(Run("total rice rendang")); // => Output: 37000

// => Run is the entry verb: split the line, dispatch on the first word
string Run(string line) // => local function: one line in, one answer out
{
    // => Split separates the verb from its nouns: menu has none, total has two
    string[] parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries); // => words of the command
    return parts[0] switch // => the verb decides, exactly like Example 75
    {
        "menu" => Menu(), // => no nouns: the whole menu answers
        "total" => Total(parts[1..]).ToString(), // => range passes the nouns along
        _ => "usage: menu | total <dishes>", // => unknown verbs teach usage
    };
}

// => Menu answers the fixed dishes: the nouns no command needs
string Menu() => "rice, rendang, sambal"; // => local function: no input, full menu

// => Total prices each noun and sums: the nouns the total verb carried
int Total(string[] dishes) => dishes.Sum(Price); // => Sum over the price of each

// => Price is the foot of the program: the leaf every path above reaches
int Price(string dish) =>
    dish switch // => local function: dish in, price out
    {
        "rice" => 12000, // => the leaf answer for rice
        "rendang" => 25000, // => the leaf answer for rendang
        _ => 0, // => unknown nouns cost nothing in this demo
    };
