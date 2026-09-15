namespace OrganicleverBe.Contexts.Journal

open System
open System.Diagnostics.CodeAnalysis
open System.Linq
open System.Threading.Tasks
open Microsoft.EntityFrameworkCore
open OrganicleverBe.Infrastructure.AppDbContext

/// Infrastructure adapters for the journal bounded context: the storage port
/// (`JournalRepository`) plus its EF Core implementation over the shared
/// `journal_entries` table. The EF entity (`JournalEntryEntity`) mirrors the
/// PGlite client schema columns one-for-one.
module Infrastructure =

    /// A storage-layer journal row. Carries the persisted shape passed across the
    /// repository port; the typed JSON `Payload` is stored verbatim as a string.
    type JournalEntryRow =
        { Id: string
          Name: string
          Payload: string
          StartedAt: DateTime
          FinishedAt: DateTime
          Labels: string array
          CreatedAt: DateTime
          UpdatedAt: DateTime }

    /// The journal storage port: full CRUD over journal rows. The application
    /// layer depends only on this record, never on EF Core directly.
    type JournalRepository =
        { Create: JournalEntryRow -> Task<JournalEntryRow>
          FindById: string -> Task<JournalEntryRow option>
          List: unit -> Task<JournalEntryRow list>
          Update: JournalEntryRow -> Task<JournalEntryRow option>
          Delete: string -> Task<bool> }

    /// Converts an EF entity into a port-level row.
    let private toRow (e: JournalEntryEntity) : JournalEntryRow =
        { Id = e.Id
          Name = e.Name
          Payload = e.Payload
          StartedAt = e.StartedAt
          FinishedAt = e.FinishedAt
          Labels = e.Labels
          CreatedAt = e.CreatedAt
          UpdatedAt = e.UpdatedAt }

    /// Converts a port-level row into an EF entity.
    let private toEntity (r: JournalEntryRow) : JournalEntryEntity =
        { Id = r.Id
          Name = r.Name
          Payload = r.Payload
          StartedAt = r.StartedAt
          FinishedAt = r.FinishedAt
          Labels = r.Labels
          CreatedAt = r.CreatedAt
          UpdatedAt = r.UpdatedAt }

    /// Builds the EF-backed journal repository over an AppDbContext.
    [<ExcludeFromCodeCoverage(Justification =
        "Integration-tested against real PostgreSQL — see tests/integration/JournalRepositoryTests.fs")>]
    let efRepository (db: AppDbContext) : JournalRepository =
        { Create =
            fun row ->
                task {
                    let entity = toEntity row
                    db.JournalEntries.Add(entity) |> ignore
                    let! _ = db.SaveChangesAsync()
                    // Detach so the context can be reused without identity-map clashes.
                    db.Entry(entity).State <- EntityState.Detached
                    return toRow entity
                }
          FindById =
            fun id ->
                task {
                    let! found = db.JournalEntries.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = id)
                    return Option.ofObj (box found) |> Option.map (fun _ -> toRow found)
                }
          List =
            fun () ->
                task {
                    let! rows =
                        db.JournalEntries.AsNoTracking().OrderByDescending(fun e -> e.CreatedAt).ToListAsync()

                    return rows |> Seq.map toRow |> List.ofSeq
                }
          Update =
            fun row ->
                task {
                    let! existing =
                        db.JournalEntries.AsNoTracking().FirstOrDefaultAsync(fun e -> e.Id = row.Id)

                    match Option.ofObj (box existing) with
                    | None -> return None
                    | Some _ ->
                        let updated = toEntity row
                        db.JournalEntries.Update(updated) |> ignore
                        let! _ = db.SaveChangesAsync()
                        db.Entry(updated).State <- EntityState.Detached
                        return Some(toRow updated)
                }
          Delete =
            fun id ->
                task {
                    let! existing = db.JournalEntries.FirstOrDefaultAsync(fun e -> e.Id = id)

                    match Option.ofObj (box existing) with
                    | None -> return false
                    | Some _ ->
                        db.JournalEntries.Remove(existing) |> ignore
                        let! _ = db.SaveChangesAsync()
                        return true
                } }
