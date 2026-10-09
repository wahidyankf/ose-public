ICatalog catalog = new MemoryCatalog([new Product("A", "Adapter")]); // => stores one available product in the catalog
var products = await Task.WhenAll([catalog.FindAsync("A"), catalog.FindAsync("missing")]); // => waits for found and missing lookups
var report = from product in products where product is not null select product.Name; // => keeps only found products in the report
Console.WriteLine(string.Join(",", report)); // => Output: Adapter

record Product(string Id, string Name); // => defines product ID and name

interface ICatalog // => declares nullable lookup contract
{
    Task<Product?> FindAsync(string id); // => missing IDs return null
}

sealed class MemoryCatalog(IEnumerable<Product> products) : ICatalog // => implements the catalog contract
{
    public Task<Product?> FindAsync(string id) => // => returns a Task of nullable Product
        Task.FromResult(products.SingleOrDefault(product => product.Id == id)); // => looks up one matching product or null
}
