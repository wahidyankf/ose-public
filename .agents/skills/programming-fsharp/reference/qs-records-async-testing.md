# F# Quick Standards — Records, Async, Formatting, Testing

### Records (Immutable by Default)

```fsharp
// CORRECT: Record type for value objects
type ZakatCalculation = {
    Wealth: decimal
    Nisab: decimal
    Amount: decimal
    CalculationDate: DateOnly
}

// CORRECT: Record copy expression (non-destructive update)
let updated = { calculation with Amount = newAmount }
```

### Async Workflows

```fsharp
// CORRECT: F# async computation expression
let calculateAsync wealth nisab = async {
    let! nisabValue = repository.GetNisabAsync()
    let result = calculateZakat wealth nisabValue
    return result
}

// CORRECT: Running async
let result = calculateAsync 10000m 5000m |> Async.RunSynchronously

// CORRECT: Task interop
let taskAsync = calculateAsync 10000m 5000m |> Async.StartAsTask
```

### Fantomas Formatting (MANDATORY)

```fsharp
// CORRECT: Fantomas-formatted code
let calculate (wealth: decimal) (nisab: decimal) =
    if wealth >= nisab then
        wealth * 0.025m
    else
        0m

// Run: dotnet fantomas . (formats all F# files)
// Pre-commit: dotnet tool run fantomas --check . (fails if not formatted)
```

### Testing with Expecto

```fsharp
open Expecto

let zakatTests =
    testList "ZakatCalculator" [
        test "calculates 2.5% when above nisab" {
            let result = calculateZakat 10000m 5000m
            Expect.equal result (Ok 250m) "Should return 2.5% of wealth"
        }
        test "returns 0 when below nisab" {
            let result = calculateZakat 1000m 5000m
            Expect.equal result (Ok 0m) "Should return 0 below nisab"
        }
    ]

[<EntryPoint>]
let main args = runTestsWithCLIArgs [] args zakatTests
```

### Property-Based Testing with FsCheck

```fsharp
open FsCheck

let zakatProperties =
    testList "ZakatCalculator properties" [
        testProperty "zakat is always non-negative" <| fun (wealth: decimal) ->
            let nisab = 5000m
            match calculateZakat (abs wealth) nisab with
            | Ok amount -> amount >= 0m
            | Error _ -> true

```
