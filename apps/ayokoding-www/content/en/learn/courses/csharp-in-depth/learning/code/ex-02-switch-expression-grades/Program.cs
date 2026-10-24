// => Example 2: Switch Expression Grades.
// => A switch expression maps an input to exactly one arm, no fallthrough.
string Grade(int score) // => local function: score in, letter out
{
    // => relational patterns list the bands top-down, highest first
    return score switch // => the subject sits after switch, before the arms
    {
        >= 90 => "A", // => 90 and up earns an A
        >= 80 => "B", // => 80 to 89 earns a B
        >= 70 => "C", // => 70 to 79 earns a C
        >= 60 => "D", // => 60 to 69 earns a D
        _ => "F", // => discard arm: every other score fails
    }; // => every arm yields a value: the expression has a result
}

// => each call below prints the letter its band awards
Console.WriteLine(Grade(95)); // => Output: A
Console.WriteLine(Grade(82)); // => Output: B
Console.WriteLine(Grade(58)); // => Output: F
