IRepository<string> repo = new MemoryRepository<string>(["Ada"]); // => repository contains the string Ada
Console.WriteLine(repo.All().Single()); // => Output: Ada

interface IRepository<T> // => declares a typed repository contract
{
    IEnumerable<T> All(); // => returns elements of type T
}

class MemoryRepository<T>(IEnumerable<T> xs) : IRepository<T> // => generic class satisfies the repository contract
{
    public IEnumerable<T> All() => xs; // => returns the captured sequence
}
