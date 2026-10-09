using Xunit; // => imports xUnit Fact and Assert

public sealed class ArithmeticTests // => groups the arithmetic test
{
    [Fact] // => marks this method for test discovery
    public void AddsTwoNumbers() => Assert.Equal(5, 2 + 3); // => passes when 2 + 3 equals 5
}
