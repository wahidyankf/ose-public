// => Example 75: Read CLI by Switch.
// => Read a CLI by its argument switch: each arm is one command the tool owns.
Console.WriteLine(Dispatch(new[] { "menu" })); // => Output: rice, rendang, sambal
Console.WriteLine(Dispatch(new[] { "price", "rice" })); // => Output: 12000
Console.WriteLine(Dispatch(new[] { "unknown" })); // => Output: usage: menu | price <dish>

// => Dispatch reads the verb first, then the nouns: the CLI reading order
// => verb plus nouns: the command shape every CLI shares underneath
string Dispatch(string[] cmd) // => local function: words in, answer out
{
    // => empty input answers usage: every CLI teaches itself first
    // => self-teaching tools need no manual for their first command
    if (cmd.Length == 0) // => no verb: nothing to dispatch on
    {
        return "usage: menu | price <dish>"; // => the self-teaching line
    }
    return cmd[0] switch // => the verb decides: one arm per command
    {
        "menu" => "rice, rendang, sambal", // => menu lists the dishes, no nouns needed
        // => guarded arm: price demands its noun before answering
        "price" when cmd.Length > 1 => Price(cmd[1]).ToString(), // => price needs a dish noun
        _ => "usage: menu | price <dish>", // => unknown verbs teach usage too
    };
}

// => Price answers from the fixed menu the commands above promise
int Price(string dish) =>
    dish switch // => local function: dish in, price out
    {
        "rice" => 12000, // => the price the price command prints
        "rendang" => 25000, // => known dish, fixed answer
        _ => 0, // => unknown dishes cost nothing in this demo
    };
