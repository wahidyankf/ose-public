## Example code for csharp-in-depth

One folder per worked example: `ex-NN-<slug>/` holds the C# sources, its `run.yaml` (`toolchain: dotnet`, standard library only), and the recorded output under `expected/`. Every unit builds with `dotnet build` and runs its `bin/Debug/net10.0/app.dll` in the harness against the recorded output under its own `expected/` folder; testing-convention units run the same shape with a hand-rolled `Check` helper printing `PASS` lines (the standard `dotnet test` command needs packages this offline course never fetches, so the convention ships as runnable console checks instead); the tooling chapter adds a `warnaserror` check run proving the file passes with warnings as errors. No example needs the network, the clock, or random seeds: fixed inputs keep every run byte-deterministic.

Every unit shares the same project file below, except where the lesson is about the project file itself (`ex-32` pins a version, `ex-33` generates documentation) and the release-mode unit (`ex-34`), which adds a second run. The `.cs` files are heavily annotated in the `// =>` notation. The lesson pages embed every file byte-identically.

**`learning/code/ex-31-stdlib-only-no-restore/app.csproj`** (the standard project file every unit shares):

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
```
