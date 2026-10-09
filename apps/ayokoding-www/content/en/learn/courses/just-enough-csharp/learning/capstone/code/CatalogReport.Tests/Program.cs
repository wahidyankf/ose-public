using Xunit;

public sealed class CatalogReportTests
{
    [Fact]
    public async Task KeepsMissingProductSafe()
    {
        var catalog = new StubCatalog(new Product("A-1", "Adapter", true));
        var report = await CatalogReport.CreateAsync(catalog, ["A-1", "missing"]);

        Assert.Equal(["Adapter: available", "unavailable"], report);
    }

    [Fact]
    public async Task OrdersFoundProductsByName()
    {
        var catalog = new MemoryCatalog([
            new Product("Z-2", "Zebra", true),
            new Product("A-1", "Adapter", false),
        ]);
        var report = await CatalogReport.CreateAsync(catalog, ["Z-2", "A-1"]);

        Assert.Equal(["Adapter: unavailable", "Zebra: available"], report);
    }

    [Fact]
    public async Task EmptyRequestProducesEmptyReport()
    {
        var catalog = new MemoryCatalog([]);
        var report = await CatalogReport.CreateAsync(catalog, []);

        Assert.Empty(report);
    }

    private sealed class StubCatalog(Product product) : ICatalog
    {
        public Task<Product?> FindAsync(string id) =>
            Task.FromResult<Product?>(id == product.Id ? product : null);
    }
}
