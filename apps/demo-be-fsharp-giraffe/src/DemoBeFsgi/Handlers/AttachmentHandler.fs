module DemoBeFsgi.Handlers.AttachmentHandler

open System
open System.Linq
open Giraffe
open Microsoft.EntityFrameworkCore
open DemoBeFsgi.Infrastructure.AppDbContext
open DemoBeFsgi.Domain.Attachment

let upload (expenseId: Guid) : HttpHandler =
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
                let form =
                    try
                        ctx.Request.ReadFormAsync() |> Async.AwaitTask |> Async.RunSynchronously |> Some
                    with _ ->
                        None

                match form with
                | None ->
                    ctx.Response.StatusCode <- 400

                    return!
                        json
                            {| error = "Bad Request"
                               message = "Expected multipart form data" |}
                            earlyReturn
                            ctx
                | Some f ->
                    let files = f.Files

                    if files.Count = 0 then
                        ctx.Response.StatusCode <- 400

                        return!
                            json
                                {| error = "Bad Request"
                                   message = "No file uploaded" |}
                                earlyReturn
                                ctx
                    else
                        let file = files[0]
                        let contentType = file.ContentType

                        match validateContentType contentType with
                        | Error(DemoBeFsgi.Domain.Types.UnsupportedMediaType m) ->
                            ctx.Response.StatusCode <- 415

                            return!
                                json
                                    {| error = "Unsupported Media Type"
                                       field = "file"
                                       message = m |}
                                    earlyReturn
                                    ctx
                        | Error _ ->
                            ctx.Response.StatusCode <- 415

                            return!
                                json
                                    {| error = "Unsupported Media Type"
                                       field = "file"
                                       message = "Unsupported content type" |}
                                    earlyReturn
                                    ctx
                        | Ok _ ->
                            match validateFileSize file.Length with
                            | Error(DemoBeFsgi.Domain.Types.FileTooLarge limit) ->
                                ctx.Response.StatusCode <- 413

                                return!
                                    json
                                        {| error = "File Too Large"
                                           message = $"File exceeds maximum size of {limit} bytes" |}
                                        earlyReturn
                                        ctx
                            | Error _ ->
                                ctx.Response.StatusCode <- 413

                                return!
                                    json
                                        {| error = "File Too Large"
                                           message = "File is too large" |}
                                        earlyReturn
                                        ctx
                            | Ok _ ->
                                use ms = new IO.MemoryStream()
                                do! file.CopyToAsync(ms)
                                let data = ms.ToArray()
                                let attachmentId = Guid.NewGuid()
                                let now = DateTime.UtcNow
                                let url = $"/api/v1/expenses/{expenseId}/attachments/{attachmentId}/file"

                                let entity: AttachmentEntity =
                                    { Id = attachmentId
                                      ExpenseId = expenseId
                                      Filename = file.FileName
                                      ContentType = contentType
                                      Size = file.Length
                                      Data = data
                                      Url = url
                                      CreatedAt = now }

                                db.Attachments.Add(entity) |> ignore
                                let! _ = db.SaveChangesAsync()

                                ctx.Response.StatusCode <- 201

                                return!
                                    json
                                        {| id = attachmentId
                                           filename = entity.Filename
                                           contentType = entity.ContentType
                                           file_size = entity.Size
                                           url = entity.Url |}
                                        earlyReturn
                                        ctx
        }

let list (expenseId: Guid) : HttpHandler =
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
                let! attachments = db.Attachments.Where(fun a -> a.ExpenseId = expenseId).ToListAsync()

                let data =
                    attachments
                    |> Seq.map (fun a ->
                        {| id = a.Id
                           filename = a.Filename
                           contentType = a.ContentType
                           file_size = a.Size
                           url = a.Url |})
                    |> Seq.toArray

                return! json {| attachments = data |} next ctx
        }

let delete (expenseId: Guid, attachmentId: Guid) : HttpHandler =
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
                let! attachment =
                    db.Attachments
                        .AsNoTracking()
                        .FirstOrDefaultAsync(fun a -> a.Id = attachmentId && a.ExpenseId = expenseId)

                if obj.ReferenceEquals(attachment, null) then
                    ctx.Response.StatusCode <- 404

                    return!
                        json
                            {| error = "Not Found"
                               message = "Attachment not found" |}
                            earlyReturn
                            ctx
                else
                    db.Attachments.Remove(attachment) |> ignore
                    let! _ = db.SaveChangesAsync()

                    ctx.Response.StatusCode <- 204
                    return! text "" earlyReturn ctx
        }
