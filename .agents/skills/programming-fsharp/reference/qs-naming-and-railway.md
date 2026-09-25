# F# Quick Standards — Naming, DUs, Railway, Pipeline

### Naming Conventions

**Modules/Types/DUs**: PascalCase - `ZakatCalculator`, `MurabahaContract`, `PaymentResult`

**Functions/Values**: camelCase - `calculateZakat`, `totalAmount`, `validateContract`

**DU Cases**: PascalCase - `Due`, `BelowNisab`, `ValidationError`

**Predicate functions**: `isValid`, `hasPayments` (boolean-returning functions prefixed with `is`/`has`)

### Discriminated Unions for Domain Modeling

```fsharp
// CORRECT: DU for domain states (exhaustive)
type ZakatResult =
    | Due of amount: decimal
    | BelowNisab
    | ValidationError of message: string

// CORRECT: Exhaustive pattern matching (compiler enforced)
let handleResult result =
    match result with
    | Due amount -> sprintf "Zakat due: %M" amount
    | BelowNisab -> "Below nisab threshold"
    | ValidationError msg -> sprintf "Error: %s" msg
```

### Railway-Oriented Programming

```fsharp
// CORRECT: Result type for error handling
let calculateZakat (wealth: decimal) (nisab: decimal) : Result<decimal, string> =
    if wealth < 0m then
        Error "Wealth cannot be negative"
    elif wealth >= nisab then
        Ok (wealth * 0.025m)
    else
        Ok 0m

// CORRECT: Computation expression for chaining
let processPayment (wealth: decimal) (nisab: decimal) =
    result {
        let! zakatAmount = calculateZakat wealth nisab
        let! validated = validateAmount zakatAmount
        return! saveZakat validated
    }
```

### Pipeline Operator

```fsharp
// CORRECT: Use |> for readable pipelines
let totalZakat =
    wealthAmounts
    |> List.filter (fun w -> w >= nisabThreshold)
    |> List.map (fun w -> w * 0.025m)
    |> List.sum

// CORRECT: Function composition with >>
let calculateAndValidate = calculateZakat >> validateZakat
```
