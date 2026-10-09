Console.WriteLine(new Primer.Badge().Name); // => Output: C#

namespace Primer // => qualifies the Badge type as Primer.Badge
{
    public class Badge // => public type inside Primer
    {
        public string Name => "C#"; // => getter returns C#
    }
}
