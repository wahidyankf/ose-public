module OrganicleverBe.Tests.Unit.Tests.JournalApiTests

open System
open System.Net
open System.Net.Http
open System.Text
open System.Threading.Tasks
open Xunit
open OrganicleverBe.Contexts.Journal.Infrastructure
open OrganicleverBe.Contexts.Journal.Application
open OrganicleverBe.Contexts.Journal.Api
open OrganicleverBe.Tests.Unit.Steps.BddState

/// Builds an in-process journal API client over an in-memory repository so the
/// CRUD routing surface can be exercised without a PostgreSQL dependency.
let private journalClient () : HttpClient =
    let repo = inMemoryRepository ()
    buildClient (routes repo)

/// A fixed row whose stored `Payload` is not valid JSON, letting a test drive
/// the wire-serialisation fallback in `entryToWire` without needing a real
/// storage layer to produce a corrupt row.
let private rowWithInvalidPayload: JournalEntryRow =
    let fixedTimestamp = DateTime(2026, 6, 14, 10, 0, 0, DateTimeKind.Utc)

    { Id = "bad-payload-1"
      Name = "reading"
      Payload = "not valid json{"
      StartedAt = fixedTimestamp
      FinishedAt = fixedTimestamp
      Labels = [||]
      CreatedAt = fixedTimestamp
      UpdatedAt = fixedTimestamp }

/// A repository stub that always serves `rowWithInvalidPayload`, regardless of
/// which id is requested.
let private repoWithInvalidPayload () : JournalRepository =
    { Create = fun _ -> Task.FromResult rowWithInvalidPayload
      FindById = fun _ -> Task.FromResult(Some rowWithInvalidPayload)
      List = fun () -> Task.FromResult [ rowWithInvalidPayload ]
      Update = fun _ -> Task.FromResult(Some rowWithInvalidPayload)
      Delete = fun _ -> Task.FromResult true }

let private jsonContent (body: string) : StringContent =
    new StringContent(body, Encoding.UTF8, "application/json")

let private validEntryJson =
    "{\"name\":\"reading\",\"payload\":{\"title\":\"Clean Code\"},\"startedAt\":\"2026-06-14T10:00:00Z\",\"finishedAt\":\"2026-06-14T10:30:00Z\",\"labels\":[\"books\"]}"

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Create a journal entry
[<Fact>]
let ``POST journal entries returns 201 with the created entry`` () =
    let client = journalClient ()

    let resp =
        client.PostAsync("/api/v1/journal/entries", jsonContent validEntryJson).Result

    Assert.Equal(HttpStatusCode.Created, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("reading", body)
    Assert.Contains("\"id\"", body)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Reject a journal entry with a blank name
[<Fact>]
let ``POST journal entries with a blank name returns 400`` () =
    let client = journalClient ()

    let bad =
        "{\"name\":\"\",\"payload\":{},\"startedAt\":\"2026-06-14T10:00:00Z\",\"finishedAt\":\"2026-06-14T10:30:00Z\",\"labels\":[]}"

    let resp = client.PostAsync("/api/v1/journal/entries", jsonContent bad).Result
    Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Reject a journal entry whose name is not a lowercase kind slug
[<Fact>]
let ``POST journal entries with an uppercase name returns 400`` () =
    let client = journalClient ()

    let bad =
        "{\"name\":\"Reading\",\"payload\":{},\"startedAt\":\"2026-06-14T10:00:00Z\",\"finishedAt\":\"2026-06-14T10:30:00Z\",\"labels\":[]}"

    let resp = client.PostAsync("/api/v1/journal/entries", jsonContent bad).Result
    Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: List journal entries
[<Fact>]
let ``GET journal entries lists created entries`` () =
    let client = journalClient ()

    client.PostAsync("/api/v1/journal/entries", jsonContent validEntryJson).Result
    |> ignore

    let resp = client.GetAsync("/api/v1/journal/entries").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("reading", body)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: List journal entries returns the newest first
[<Fact>]
let ``GET journal entries lists the newest entry first`` () =
    let at (hour: int) =
        DateTime(2026, 6, 14, hour, 0, 0, DateTimeKind.Utc)

    let older =
        { rowWithInvalidPayload with
            Id = "older-entry"
            Name = "reading"
            Payload = "{}"
            CreatedAt = at 10 }

    let newer =
        { older with
            Id = "newer-entry"
            Name = "focus"
            CreatedAt = at 11 }

    // The repository returns the older row first; the listing must still put the newest entry first.
    let repo: JournalRepository =
        { Create = fun row -> Task.FromResult row
          FindById = fun _ -> Task.FromResult None
          List = fun () -> Task.FromResult [ older; newer ]
          Update = fun _ -> Task.FromResult None
          Delete = fun _ -> Task.FromResult false }

    let body =
        (buildClient (routes repo)).GetAsync("/api/v1/journal/entries").Result.Content.ReadAsStringAsync().Result

    Assert.True(body.IndexOf("newer-entry") < body.IndexOf("older-entry"), body)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Fetch a missing journal entry
[<Fact>]
let ``GET a missing journal entry returns 404`` () =
    let client = journalClient ()
    let resp = client.GetAsync("/api/v1/journal/entries/does-not-exist").Result
    Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Fetch an existing journal entry by id returns it
[<Fact>]
let ``GET a created journal entry by id returns 200`` () =
    let client = journalClient ()

    let created =
        client.PostAsync("/api/v1/journal/entries", jsonContent validEntryJson).Result

    let createdBody = created.Content.ReadAsStringAsync().Result
    let id = extractId createdBody
    let resp = client.GetAsync(sprintf "/api/v1/journal/entries/%s" id).Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Fetch an existing journal entry by id returns it
[<Fact>]
let ``GET a created journal entry by id returns that entry`` () =
    let client = journalClient ()

    let created =
        client.PostAsync("/api/v1/journal/entries", jsonContent validEntryJson).Result

    let id = extractId (created.Content.ReadAsStringAsync().Result)
    let resp = client.GetAsync(sprintf "/api/v1/journal/entries/%s" id).Result
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    Assert.Contains(id, body)
    Assert.Contains("reading", body)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Update a journal entry
[<Fact>]
let ``PUT a created journal entry updates it and returns 200`` () =
    let client = journalClient ()

    let created =
        client.PostAsync("/api/v1/journal/entries", jsonContent validEntryJson).Result

    let id = extractId (created.Content.ReadAsStringAsync().Result)
    let update = "{\"name\":\"learning\"}"

    let resp =
        client.PutAsync(sprintf "/api/v1/journal/entries/%s" id, jsonContent update).Result

    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("learning", body)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Update a missing journal entry returns 404
[<Fact>]
let ``PUT a missing journal entry returns 404`` () =
    let client = journalClient ()
    let update = "{\"name\":\"learning\"}"

    let resp =
        client.PutAsync("/api/v1/journal/entries/does-not-exist", jsonContent update).Result

    Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Delete a journal entry
[<Fact>]
let ``DELETE a created journal entry returns 204 and removes it`` () =
    let client = journalClient ()

    let created =
        client.PostAsync("/api/v1/journal/entries", jsonContent validEntryJson).Result

    let id = extractId (created.Content.ReadAsStringAsync().Result)
    let resp = client.DeleteAsync(sprintf "/api/v1/journal/entries/%s" id).Result
    Assert.Equal(HttpStatusCode.NoContent, resp.StatusCode)
    let after = client.GetAsync(sprintf "/api/v1/journal/entries/%s" id).Result
    Assert.Equal(HttpStatusCode.NotFound, after.StatusCode)

// @scenario specs/apps/organiclever/be/behaviours/journal/journal-crud.feature: Delete a missing journal entry returns 404
[<Fact>]
let ``DELETE a missing journal entry returns 404`` () =
    let client = journalClient ()
    let resp = client.DeleteAsync("/api/v1/journal/entries/does-not-exist").Result
    Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode)

[<Fact>]
let ``POST journal entries with only a name defaults every optional field`` () =
    let client = journalClient ()
    let minimal = "{\"name\":\"reading\"}"

    let resp = client.PostAsync("/api/v1/journal/entries", jsonContent minimal).Result

    Assert.Equal(HttpStatusCode.Created, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("reading", body)

[<Fact>]
let ``POST journal entries with malformed JSON returns 400`` () =
    let client = journalClient ()

    let resp =
        client.PostAsync("/api/v1/journal/entries", jsonContent "{not valid json").Result

    Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode)

[<Fact>]
let ``PUT a journal entry with malformed JSON returns 400`` () =
    let client = journalClient ()

    let created =
        client.PostAsync("/api/v1/journal/entries", jsonContent validEntryJson).Result

    let id = extractId (created.Content.ReadAsStringAsync().Result)

    let resp =
        client.PutAsync(sprintf "/api/v1/journal/entries/%s" id, jsonContent "{not valid json").Result

    Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode)

[<Fact>]
let ``PUT a journal entry without a name field updates only the supplied fields`` () =
    let client = journalClient ()

    let created =
        client.PostAsync("/api/v1/journal/entries", jsonContent validEntryJson).Result

    let id = extractId (created.Content.ReadAsStringAsync().Result)
    let update = "{\"payload\":{\"title\":\"Refactoring\"}}"

    let resp =
        client.PutAsync(sprintf "/api/v1/journal/entries/%s" id, jsonContent update).Result

    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("reading", body)
    Assert.Contains("Refactoring", body)

[<Fact>]
let ``PUT a journal entry with an invalid name format returns 400`` () =
    let client = journalClient ()

    let created =
        client.PostAsync("/api/v1/journal/entries", jsonContent validEntryJson).Result

    let id = extractId (created.Content.ReadAsStringAsync().Result)
    let update = "{\"name\":\"Invalid Name\"}"

    let resp =
        client.PutAsync(sprintf "/api/v1/journal/entries/%s" id, jsonContent update).Result

    Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode)

[<Fact>]
let ``GET a journal entry whose stored payload is not valid JSON still serialises`` () =
    let client = buildClient (routes (repoWithInvalidPayload ()))
    let resp = client.GetAsync("/api/v1/journal/entries/bad-payload-1").Result
    Assert.Equal(HttpStatusCode.OK, resp.StatusCode)
    let body = resp.Content.ReadAsStringAsync().Result
    Assert.Contains("bad-payload-1", body)
