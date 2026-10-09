var move = (0, 1); // => tuple holds coordinates 0 and 1
var label = move switch // => matches both tuple positions
{
    (0, 0) => "still", // => origin maps to still
    (0, _) => "vertical", // => first coordinate 0 maps to vertical
    _ => "other", // => remaining moves map to other
}; // => vertical arm wins for this tuple
Console.WriteLine(label); // => Output: vertical
