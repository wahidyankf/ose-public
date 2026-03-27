module DemoBeFsgi.Handlers.ExpenseHandler

open System
open System.Linq
open System.Text.Json
open Giraffe
open Microsoft.EntityFrameworkCore
open DemoBeFsgi.Infrastructure.AppDbContext
open DemoBeFsgi.Domain.Types
open DemoBeFsgi.Domain.Expense
open DemoBeFsgi.Contracts.ContractWrappers

let private parseAmount (s: string) =
    if String.IsNullOrEmpty s then
        Error(ValidationError("amount", "Amount is required"))
    else
        match Decimal.TryParse(s, Globalization.NumberStyles.Any, Globalization.CultureInfo.InvariantCulture) with
        | true, v -> Ok v
        | _ -> Error(ValidationError("amount", "Invalid amount format"))

let create: HttpHandler =
    fun _next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()

            let req =
                try
                    JsonSerializer.Deserialize<CreateExpenseRequest>(
                        body,
                        JsonSerializerOptions(PropertyNameCaseInsensitive = true)
                    )
                    |> Some
                with _ ->
                    None

            match req with
            | None ->
                ctx.Response.StatusCode <- 400

                return!
                    json
                        {| error = "Bad Request"
                           message = "Invalid request body" |}
                        earlyReturn
                        ctx
            | Some r ->
                let currencyResult = parseCurrency (if r.currency = null then "" else r.currency)

                match currencyResult with
                | Error(ValidationError(f, m)) ->
                    ctx.Response.StatusCode <- 400

                    return!
                        json
                            {| error = "Validation Error"
                               field = f
                               message = m |}
                            earlyReturn
                            ctx
                | Error _ ->
                    ctx.Response.StatusCode <- 400

                    return!
                        json
                            {| error = "Validation Error"
                               field = "currency"
                               message = "Invalid currency" |}
                            earlyReturn
                            ctx
                | Ok _ ->
                    let amountResult = parseAmount r.amount

                    match amountResult with
                    | Error(ValidationError(f, m)) ->
                        ctx.Response.StatusCode <- 400

                        return!
                            json
                                {| error = "Validation Error"
                                   field = f
                                   message = m |}
                                earlyReturn
                                ctx
                    | Error _ ->
                        ctx.Response.StatusCode <- 400

                        return!
                            json
                                {| error = "Validation Error"
                                   field = "amount"
                                   message = "Invalid amount" |}
                                earlyReturn
                                ctx
                    | Ok amount ->
                        let amountValidation = validateAmount amount

                        match amountValidation with
                        | Error(ValidationError(f, m)) ->
                            ctx.Response.StatusCode <- 400

                            return!
                                json
                                    {| error = "Validation Error"
                                       field = f
                                       message = m |}
                                    earlyReturn
                                    ctx
                        | Error _ ->
                            ctx.Response.StatusCode <- 400

                            return!
                                json
                                    {| error = "Validation Error"
                                       field = "amount"
                                       message = "Invalid amount" |}
                                    earlyReturn
                                    ctx
                        | Ok validAmount ->
                            let unitOpt = if String.IsNullOrEmpty r.unit then None else Some r.unit
                            let unitResult = validateUnit unitOpt

                            match unitResult with
                            | Error(ValidationError(f, m)) ->
                                ctx.Response.StatusCode <- 400

                                return!
                                    json
                                        {| error = "Validation Error"
                                           field = f
                                           message = m |}
                                        earlyReturn
                                        ctx
                            | Error _ ->
                                ctx.Response.StatusCode <- 400

                                return!
                                    json
                                        {| error = "Validation Error"
                                           field = "unit"
                                           message = "Invalid unit" |}
                                        earlyReturn
                                        ctx
                            | Ok validUnit ->
                                let db = ctx.GetService<AppDbContext>()
                                let userId = ctx.Items["UserId"] :?> Guid

                                let dateVal =
                                    match DateTime.TryParse(r.date) with
                                    | true, d -> DateTime.SpecifyKind(d, DateTimeKind.Utc)
                                    | _ -> DateTime.UtcNow

                                let now = DateTime.UtcNow
                                let expenseId = Guid.NewGuid()

                                let entity: ExpenseEntity =
                                    { Id = expenseId
                                      UserId = userId
                                      Amount = validAmount
                                      Currency = r.currency.ToUpperInvariant()
                                      Category = if r.category = null then "" else r.category
                                      Description = if r.description = null then "" else r.description
                                      Date = dateVal
                                      Type =
                                        if r.``type`` = null then
                                            "EXPENSE"
                                        else
                                            r.``type``.ToUpperInvariant()
                                      Quantity =
                                        if r.quantity.HasValue then
                                            Nullable(decimal r.quantity.Value)
                                        else
                                            Nullable()
                                      Unit =
                                        match validUnit with
                                        | Some u -> u
                                        | None -> null
                                      CreatedAt = now
                                      UpdatedAt = now }

                                db.Expenses.Add(entity) |> ignore
                                let! _ = db.SaveChangesAsync()

                                ctx.Response.StatusCode <- 201

                                let formattedAmount =
                                    match r.currency.ToUpperInvariant() with
                                    | "IDR" -> validAmount.ToString("0")
                                    | _ -> validAmount.ToString("0.00")

                                return!
                                    json
                                        {| id = expenseId
                                           userId = userId
                                           amount = formattedAmount
                                           currency = entity.Currency
                                           category = entity.Category
                                           description = entity.Description
                                           date = entity.Date.ToString("yyyy-MM-dd")
                                           ``type`` = entity.Type.ToLowerInvariant() |}
                                        earlyReturn
                                        ctx
        }

let list: HttpHandler =
    fun next ctx ->
        task {
            let userId = ctx.Items["UserId"] :?> Guid
            let db = ctx.GetService<AppDbContext>()
            let pageParam = ctx.TryGetQueryStringValue("page") |> Option.defaultValue "1"
            let sizeParam = ctx.TryGetQueryStringValue("size") |> Option.defaultValue "20"

            let page =
                Math.Max(
                    1,
                    try
                        int pageParam
                    with _ ->
                        1
                )

            let size =
                Math.Max(
                    1,
                    try
                        int sizeParam
                    with _ ->
                        20
                )

            let query = db.Expenses.Where(fun e -> e.UserId = userId)
            let! total = query.CountAsync()
            let offset = (page - 1) * size

            let! expenses = query.OrderByDescending(fun e -> e.Date).Skip(offset).Take(size).ToListAsync()

            let data =
                expenses
                |> Seq.map (fun e ->
                    let formattedAmount =
                        match e.Currency with
                        | "IDR" -> e.Amount.ToString("0")
                        | _ -> e.Amount.ToString("0.00")

                    let qtyOpt =
                        if e.Quantity.HasValue then
                            Some(float e.Quantity.Value)
                        else
                            None

                    {| id = e.Id
                       userId = e.UserId
                       amount = formattedAmount
                       currency = e.Currency
                       category = e.Category
                       description = e.Description
                       date = e.Date.ToString("yyyy-MM-dd")
                       ``type`` = e.Type.ToLowerInvariant()
                       quantity = qtyOpt
                       unit = if e.Unit = null then None else Some e.Unit |})
                |> Seq.toArray

            return!
                json
                    {| content = data
                       totalElements = total
                       page = page |}
                    next
                    ctx
        }

let getById (expenseId: Guid) : HttpHandler =
    fun next ctx ->
        task {
            let userId = ctx.Items["UserId"] :?> Guid
            let db = ctx.GetService<AppDbContext>()

            let! expense = db.Expenses.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = expenseId)

            if obj.ReferenceEquals(expense, null) then
                ctx.Response.StatusCode <- 404

                return!
                    json
                        {| error = "Not Found"
                           message = "Expense not found" |}
                        earlyReturn
                        ctx
            elif expense.UserId <> userId then
                ctx.Response.StatusCode <- 403

                return!
                    json
                        {| error = "Forbidden"
                           message = "Access denied" |}
                        earlyReturn
                        ctx
            else
                let formattedAmount =
                    match expense.Currency with
                    | "IDR" -> expense.Amount.ToString("0")
                    | _ -> expense.Amount.ToString("0.00")

                let qtyOpt =
                    if expense.Quantity.HasValue then
                        Some(float expense.Quantity.Value)
                    else
                        None

                return!
                    json
                        {| id = expense.Id
                           userId = expense.UserId
                           amount = formattedAmount
                           currency = expense.Currency
                           category = expense.Category
                           description = expense.Description
                           date = expense.Date.ToString("yyyy-MM-dd")
                           ``type`` = expense.Type.ToLowerInvariant()
                           quantity = qtyOpt
                           unit = if expense.Unit = null then None else Some expense.Unit |}
                        next
                        ctx
        }

let update (expenseId: Guid) : HttpHandler =
    fun next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()

            let req =
                try
                    JsonSerializer.Deserialize<UpdateExpenseRequest>(
                        body,
                        JsonSerializerOptions(PropertyNameCaseInsensitive = true)
                    )
                    |> Some
                with _ ->
                    None

            match req with
            | None ->
                ctx.Response.StatusCode <- 400

                return!
                    json
                        {| error = "Bad Request"
                           message = "Invalid request body" |}
                        earlyReturn
                        ctx
            | Some r ->
                let userId = ctx.Items["UserId"] :?> Guid
                let db = ctx.GetService<AppDbContext>()

                let! expense = db.Expenses.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = expenseId)

                if obj.ReferenceEquals(expense, null) then
                    ctx.Response.StatusCode <- 404

                    return!
                        json
                            {| error = "Not Found"
                               message = "Expense not found" |}
                            earlyReturn
                            ctx
                elif expense.UserId <> userId then
                    ctx.Response.StatusCode <- 403

                    return!
                        json
                            {| error = "Forbidden"
                               message = "Access denied" |}
                            earlyReturn
                            ctx
                else
                    let amountResult = parseAmount r.amount

                    match amountResult with
                    | Error(ValidationError(f, m)) ->
                        ctx.Response.StatusCode <- 400

                        return!
                            json
                                {| error = "Validation Error"
                                   field = f
                                   message = m |}
                                earlyReturn
                                ctx
                    | Error _ ->
                        ctx.Response.StatusCode <- 400

                        return!
                            json
                                {| error = "Validation Error"
                                   field = "amount"
                                   message = "Invalid amount" |}
                                earlyReturn
                                ctx
                    | Ok amount ->
                        let dateVal =
                            match DateTime.TryParse(r.date) with
                            | true, d -> DateTime.SpecifyKind(d, DateTimeKind.Utc)
                            | _ -> expense.Date

                        let updated =
                            { expense with
                                Amount = amount
                                Currency =
                                    if r.currency <> null then
                                        r.currency.ToUpperInvariant()
                                    else
                                        expense.Currency
                                Category = if r.category <> null then r.category else expense.Category
                                Description =
                                    if r.description <> null then
                                        r.description
                                    else
                                        expense.Description
                                Date = dateVal
                                Type =
                                    if r.``type`` <> null then
                                        r.``type``.ToUpperInvariant()
                                    else
                                        expense.Type
                                UpdatedAt = DateTime.UtcNow }

                        db.Expenses.Update(updated) |> ignore
                        let! _ = db.SaveChangesAsync()

                        let formattedAmount =
                            match updated.Currency with
                            | "IDR" -> updated.Amount.ToString("0")
                            | _ -> updated.Amount.ToString("0.00")

                        return!
                            json
                                {| id = updated.Id
                                   userId = updated.UserId
                                   amount = formattedAmount
                                   currency = updated.Currency
                                   category = updated.Category
                                   description = updated.Description
                                   date = updated.Date.ToString("yyyy-MM-dd")
                                   ``type`` = updated.Type.ToLowerInvariant() |}
                                next
                                ctx
        }

let delete (expenseId: Guid) : HttpHandler =
    fun _next ctx ->
        task {
            let userId = ctx.Items["UserId"] :?> Guid
            let db = ctx.GetService<AppDbContext>()

            let! expense = db.Expenses.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = expenseId)

            if obj.ReferenceEquals(expense, null) then
                ctx.Response.StatusCode <- 404

                return!
                    json
                        {| error = "Not Found"
                           message = "Expense not found" |}
                        earlyReturn
                        ctx
            elif expense.UserId <> userId then
                ctx.Response.StatusCode <- 403

                return!
                    json
                        {| error = "Forbidden"
                           message = "Access denied" |}
                        earlyReturn
                        ctx
            else
                db.Expenses.Remove(expense) |> ignore
                let! _ = db.SaveChangesAsync()

                ctx.Response.StatusCode <- 204
                return! text "" earlyReturn ctx
        }

let summary: HttpHandler =
    fun next ctx ->
        task {
            let userId = ctx.Items["UserId"] :?> Guid
            let db = ctx.GetService<AppDbContext>()

            let! expenses = db.Expenses.Where(fun e -> e.UserId = userId && e.Type = "EXPENSE").ToListAsync()

            let grouped =
                expenses
                |> Seq.groupBy (fun e -> e.Currency)
                |> Seq.map (fun (currency, items) ->
                    let total = items |> Seq.sumBy (fun e -> e.Amount)

                    let formattedTotal =
                        match currency with
                        | "IDR" -> total.ToString("0")
                        | _ -> total.ToString("0.00")

                    currency, formattedTotal)
                |> Map.ofSeq

            return! json grouped next ctx
        }
