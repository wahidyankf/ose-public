// => Example 51: Record Equals by Value.
// => Records compare by value: same fields means equal, whatever the instance.
var first = new Dish("rendang", 25000); // => first instance with these fields
var second = new Dish("rendang", 25000); // => second instance, same fields

// => == on records answers by value: two instances, one shared meaning
Console.WriteLine(first == second); // => Output: True

// => classes answer by reference: identical fields still mean different objects
var a = new Plate("rendang"); // => one heap object named a
var b = new Plate("rendang"); // => another heap object with the same dish
Console.WriteLine(a == b); // => Output: False

// => types follow the statements: value semantics first, reference second
record Dish(string Name, int Price); // => record: equality over every field

class Plate // => class: equality over identity unless overridden
{
    public string Dish; // => same data shape, opposite equality rule

    public Plate(string dish) => Dish = dish; // => constructor sets the dish
}
