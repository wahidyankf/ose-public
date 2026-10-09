var box = new Box(3, 4); // => constructor receives width 3 and height 4
Console.WriteLine(box.Area); // => Output: 12

class Box(int w, int h) // => captures width 3 and height 4
{
    public int Area => w * h; // => computes 3 * 4 on access
}
