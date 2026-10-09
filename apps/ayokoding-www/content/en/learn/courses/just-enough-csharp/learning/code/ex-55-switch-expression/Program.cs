var score = 82; // => 82 satisfies the first relational arm
var result = score switch // => classifies score 82
{
    >= 80 => "distinction", // => 82 satisfies this arm, yielding distinction
    >= 50 => "pass", // => scores 50 through 79 yield pass
    _ => "retry", // => scores below 50 yield retry
};
Console.WriteLine(result); // => Output: distinction
