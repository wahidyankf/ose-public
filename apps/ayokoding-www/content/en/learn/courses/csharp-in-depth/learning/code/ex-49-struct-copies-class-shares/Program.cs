// => Example 49: Struct Copies, Class Shares.
// => Assigning a struct copies the value; assigning a class shares the object.
var sari = new Serving { Dish = "rice", Qty = 2 }; // => struct value on the stack
var same = sari; // => struct assignment copies every field into same
same.Qty = 9; // => mutating the copy leaves the original untouched

// => sari still holds 2: the copy took its own path at assignment
Console.WriteLine($"struct kept: {sari.Qty}"); // => Output: struct kept: 2
var order = new Order { Dish = "rice", Qty = 2 }; // => class instance on the heap
var alias = order; // => class assignment copies the reference, not the dish
alias.Qty = 9; // => mutating through the alias mutates the one object

// => order reads 9: alias and order name the same heap object
Console.WriteLine($"class shared: {order.Qty}"); // => Output: class shared: 9

// => types follow the statements: value shape first, reference shape second
struct Serving // => struct: assignment copies the whole value
{
    public string Dish; // => mutable field: the demo mutates copies freely
    public int Qty; // => copied alongside Dish on every assignment
}

class Order // => class: assignment shares the single instance
{
    public string Dish = ""; // => default keeps the warnings quiet
    public int Qty; // => one Qty cell shared by every alias
}
