module DemoBeFsgi.Handlers.ReportHandler

open System
open System.Linq
open Giraffe
open Microsoft.EntityFrameworkCore
open DemoBeFsgi.Infrastructure.AppDbContext

let profitAndLoss: HttpHandler =
    fun next ctx ->
        task {
            let userId = ctx.Items["UserId"] :?> Guid
            let db = ctx.GetService<AppDbContext>()

            let fromParam =
                ctx.TryGetQueryStringValue("startDate")
                |> Option.orElseWith (fun () -> ctx.TryGetQueryStringValue("from"))

            let toParam =
                ctx.TryGetQueryStringValue("endDate")
                |> Option.orElseWith (fun () -> ctx.TryGetQueryStringValue("to"))

            let currencyParam =
                ctx.TryGetQueryStringValue("currency") |> Option.defaultValue "USD"

            let fromDate =
                match fromParam with
                | Some s ->
                    match DateTime.TryParse(s) with
                    | true, d -> DateTime.SpecifyKind(d, DateTimeKind.Utc)
                    | _ -> DateTime.SpecifyKind(DateTime.MinValue, DateTimeKind.Utc)
                | None -> DateTime.SpecifyKind(DateTime.MinValue, DateTimeKind.Utc)

            let toDate =
                match toParam with
                | Some s ->
                    match DateTime.TryParse(s) with
                    | true, d -> DateTime.SpecifyKind(d.AddDays(1.0).AddSeconds(-1.0), DateTimeKind.Utc)
                    | _ -> DateTime.SpecifyKind(DateTime.MaxValue, DateTimeKind.Utc)
                | None -> DateTime.SpecifyKind(DateTime.MaxValue, DateTimeKind.Utc)

            let currency = currencyParam.ToUpperInvariant()

            let! entries =
                db.Expenses
                    .Where(fun e ->
                        e.UserId = userId
                        && e.Currency = currency
                        && e.Date >= fromDate
                        && e.Date <= toDate)
                    .ToListAsync()

            let incomeEntries = entries |> Seq.filter (fun e -> e.EntryType = "INCOME")
            let expenseEntries = entries |> Seq.filter (fun e -> e.EntryType = "EXPENSE")

            let incomeTotal = incomeEntries |> Seq.sumBy (fun e -> e.Amount)
            let expenseTotal = expenseEntries |> Seq.sumBy (fun e -> e.Amount)
            let net = incomeTotal - expenseTotal

            let formatAmount (a: decimal) =
                match currency with
                | "IDR" -> a.ToString("0")
                | _ -> a.ToString("0.00")

            let incomeBreakdown =
                incomeEntries
                |> Seq.groupBy (fun e -> e.Category)
                |> Seq.map (fun (cat, items) ->
                    {| category = cat
                       ``type`` = "income"
                       total = formatAmount (items |> Seq.sumBy (fun e -> e.Amount)) |})
                |> Seq.toArray

            let expenseBreakdown =
                expenseEntries
                |> Seq.groupBy (fun e -> e.Category)
                |> Seq.map (fun (cat, items) ->
                    {| category = cat
                       ``type`` = "expense"
                       total = formatAmount (items |> Seq.sumBy (fun e -> e.Amount)) |})
                |> Seq.toArray

            return!
                json
                    {| totalIncome = formatAmount incomeTotal
                       totalExpense = formatAmount expenseTotal
                       net = formatAmount net
                       currency = currency
                       incomeBreakdown = incomeBreakdown
                       expenseBreakdown = expenseBreakdown |}
                    next
                    ctx
        }
