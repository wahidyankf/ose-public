module OseBe.Infrastructure.Repositories.EfRepositories

open System
open System.Diagnostics.CodeAnalysis
open System.Linq
open System.Threading.Tasks
open Microsoft.EntityFrameworkCore
open OseBe.Infrastructure.AppDbContext
open OseBe.Infrastructure.Repositories.RepositoryTypes

/// Builds the EF-backed regulatory-document repository over an AppDbContext.
[<ExcludeFromCodeCoverage(Justification =
    "Integration-tested against real PostgreSQL — see tests/integration/DatabaseBootTests.fs")>]
let regulatoryDocumentRepository (db: AppDbContext) : RegulatoryDocumentRepository =
    { Create =
        fun entity ->
            task {
                db.RegulatoryDocuments.Add(entity) |> ignore
                let! _ = db.SaveChangesAsync()
                return entity
            }
      FindById =
        fun id ->
            task {
                let! found = db.RegulatoryDocuments.FirstOrDefaultAsync(fun d -> d.Id = id)
                return Option.ofObj (box found) |> Option.map (fun _ -> found)
            }
      List =
        fun () ->
            task {
                let! rows = db.RegulatoryDocuments.AsNoTracking().ToListAsync()
                return List.ofSeq rows
            } }

/// Builds the EF-backed internal-policy-document repository over an AppDbContext.
[<ExcludeFromCodeCoverage(Justification =
    "Integration-tested against real PostgreSQL — see tests/integration/DatabaseBootTests.fs")>]
let internalPolicyDocumentRepository (db: AppDbContext) : InternalPolicyDocumentRepository =
    { Create =
        fun entity ->
            task {
                db.InternalPolicyDocuments.Add(entity) |> ignore
                let! _ = db.SaveChangesAsync()
                return entity
            }
      FindById =
        fun id ->
            task {
                let! found = db.InternalPolicyDocuments.FirstOrDefaultAsync(fun d -> d.Id = id)
                return Option.ofObj (box found) |> Option.map (fun _ -> found)
            }
      List =
        fun () ->
            task {
                let! rows = db.InternalPolicyDocuments.AsNoTracking().ToListAsync()
                return List.ofSeq rows
            } }
