IClock clock = new FixedClock(); // => interface reference holds the fixed clock
Console.WriteLine(clock.Now()); // => Output: noon

interface IClock // => declares the clock contract
{
    string Now(); // => implementers return a string
}

class FixedClock : IClock // => FixedClock implements IClock
{
    public string Now() => "noon"; // => returns the fixed time noon
}
