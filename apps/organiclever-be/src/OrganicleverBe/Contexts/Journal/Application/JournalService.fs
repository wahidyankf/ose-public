namespace OrganicleverBe.Contexts.Journal

open System
open System.Threading.Tasks
open OrganicleverBe.Contexts.Journal.Domain
open OrganicleverBe.Contexts.Journal.Infrastructure

/// Application use cases for the journal bounded context: create, read, list,
/// update, and delete journal entries through the storage port. The layer is
/// independent of HTTP and of EF Core — it depends only on `JournalRepository`.
module Application =

    /// ISO-8601 round-trip ("o") format used on the wire and matching the client
    /// IsoTimestamp schema.
    let private toIso (dt: DateTime) : string =
        dt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

    /// Parses an ISO timestamp, defaulting to UtcNow when the string is absent or
    /// unparseable (the domain enforces presence on create).
    let private parseIso (s: string) : DateTime =
        match DateTime.TryParse(s, null, Globalization.DateTimeStyles.AdjustToUniversal) with
        | true, dt -> dt.ToUniversalTime()
        | false, _ -> DateTime.UtcNow

    /// Renders a storage row as the client-facing JournalEntry.
    let toEntry (row: JournalEntryRow) : JournalEntry =
        { Id = row.Id
          Name = row.Name
          Payload = row.Payload
          StartedAt = toIso row.StartedAt
          FinishedAt = toIso row.FinishedAt
          Labels = List.ofArray row.Labels
          CreatedAt = toIso row.CreatedAt
          UpdatedAt = toIso row.UpdatedAt }

    /// Creates a validated journal entry, assigning a fresh id and audit
    /// timestamps. Returns `Error` when the input fails domain validation.
    let create (repo: JournalRepository) (input: NewEntryInput) : Task<Result<JournalEntry, string>> =
        task {
            match validateNewEntry input with
            | Error msg -> return Error msg
            | Ok valid ->
                let now = DateTime.UtcNow

                let row: JournalEntryRow =
                    { Id = Guid.NewGuid().ToString()
                      Name = valid.Name
                      Payload = valid.Payload
                      StartedAt = parseIso valid.StartedAt
                      FinishedAt = parseIso valid.FinishedAt
                      Labels = Array.ofList valid.Labels
                      CreatedAt = now
                      UpdatedAt = now }

                let! created = repo.Create row
                return Ok(toEntry created)
        }

    /// Lists all journal entries, newest first.
    let list (repo: JournalRepository) : Task<JournalEntry list> =
        task {
            let! rows = repo.List()
            return rows |> List.sortByDescending (fun r -> r.CreatedAt) |> List.map toEntry
        }

    /// Finds a single journal entry by id.
    let findById (repo: JournalRepository) (id: string) : Task<JournalEntry option> =
        task {
            let! row = repo.FindById id
            return row |> Option.map toEntry
        }

    /// Applies an update to an existing entry. Returns `Ok None` when the entry is
    /// absent and `Error` when the supplied name fails validation.
    let update
        (repo: JournalRepository)
        (id: string)
        (input: UpdateEntryInput)
        : Task<Result<JournalEntry option, string>> =
        task {
            let nameCheck =
                match input.Name with
                | Some n -> validateName n |> Result.map Some
                | None -> Ok None

            match nameCheck with
            | Error msg -> return Error msg
            | Ok _ ->
                let! existing = repo.FindById id

                match existing with
                | None -> return Ok None
                | Some row ->
                    let merged =
                        { row with
                            Name = defaultArg input.Name row.Name
                            Payload = defaultArg input.Payload row.Payload
                            UpdatedAt = DateTime.UtcNow }

                    let! updated = repo.Update merged
                    return Ok(updated |> Option.map toEntry)
        }

    /// Deletes a journal entry by id, returning whether a row was removed.
    let delete (repo: JournalRepository) (id: string) : Task<bool> = repo.Delete id
