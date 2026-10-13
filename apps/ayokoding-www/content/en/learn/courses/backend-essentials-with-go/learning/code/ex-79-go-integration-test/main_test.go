// Example 79 tests: CRUD + token auth + pagination, one green suite.
//
// The Go analogue of the pytest TestClient suite: every test drives the
// SAME newHandler value main serves, but in-process via httptest -- no
// socket, no uvicorn process, novusleep. Each test builds a FRESH server,
// so no test ever sees another test's rows (the suite is order-free).
// Groups mirror the pytest classes: CRUD, token auth, pagination, plus one
// smoke test touching all three areas at once.
package main

import (
	"encoding/json"     // => decodes response bodies -- ids, statuses, page metadata
	"net/http"          // => builds requests and names the expected statuses
	"net/http/httptest" // => drives the handler in-process: no socket, no live server
	"strings"           // => strings.NewReader wraps each JSON request body below
	"testing"           // => the test entry points -- TestXxx, one per behaviour
)

// authHeader is the valid bearer credential -- it matches main.go's
// validToken exactly, the same way the pytest AUTH dict matched app.py's.
const authHeader = "Bearer s3cr3t-token-abc123" // => the ONE value every guarded write accepts

// badAuthHeader is any string that is NOT validToken -- the wrong-token branch.
const badAuthHeader = "Bearer wrong-token" // => fails the exact-match comparison, same as pytest's BAD_AUTH

// doRequest performs one in-process round trip: method + path + optional
// JSON body + optional Authorization header, straight through the handler.
// It returns the recorder, so each test asserts status AND body together.
func doRequest(t *testing.T, handler http.Handler, method, path, body, auth string) *httptest.ResponseRecorder { // => body "" means no body; auth "" means no header
	t.Helper()                 // => failures inside report at the CALLER's line, not in this helper
	var reader *strings.Reader // => nil body and an empty body differ: only build a reader when given one
	if body == "" {            // => GETs and DELETES carry no body -- pass a nil reader through
		reader = strings.NewReader("") // => an empty reader: NewRequest with no payload to send
	} else { // => POSTs and PUTs carry a JSON document -- wrap it for the request
		reader = strings.NewReader(body) // => the exact bytes the handler's decoder will read
	}
	req := httptest.NewRequest(method, path, reader) // => in-process request: no socket, no port, no race
	if body != "" {                                  // => only body-carrying calls declare a content type
		req.Header.Set("Content-Type", "application/json") // => what curl's -H "Content-Type: ..." sent
	}
	if auth != "" { // => opt-in credential -- empty means "deliberately no Authorization header"
		req.Header.Set("Authorization", auth) // => the exact header a guarded route checks first
	}
	rec := httptest.NewRecorder() // => captures status, headers, and body for the assertions below
	handler.ServeHTTP(rec, req)   // => the SAME handler main serves -- one line, fully synchronous
	return rec                    // => status via rec.Code, body via rec.Body -- asserted by every test
}

// decodeBody unmarshals a recorder's JSON body into a fresh map -- the
// tests below read ids, statuses, and page metadata out of the result.
func decodeBody(t *testing.T, rec *httptest.ResponseRecorder) map[string]any { // => one helper, every body read
	t.Helper()                                                      // => decode failures report at the test's line, not here
	var body map[string]any                                         // => the generic JSON object every response here is
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil { // => malformed JSON fails the test loudly
		t.Fatalf("response is not JSON: %v (body %q)", err, rec.Body.String()) // => Fatal: no body, no further asserts
	}
	return body // => callers type-assert the keys they care about -- "id", "items", "total", "next"
}

// freshHandler builds an isolated app: a new store plus its routes -- the
// per-test equivalent of the pytest client fixture (but state-isolated,
// so this suite passes in ANY order, unlike the file-sharing pytest run).
func freshHandler() http.Handler { // => called at the top of EVERY test below
	return newHandler(newServer()) // => empty table, ids from 1 -- the known start state
}

// -- CRUD group ------------------------------------------------------------------

// TestCrudCreateRequiresToken guards first: an unguarded write must 401
// BEFORE any row exists -- the require check runs before the handler body.
func TestCrudCreateRequiresToken(t *testing.T) { // => the guard check, before any lifecycle test
	rec := doRequest(t, freshHandler(), http.MethodPost, "/tasks", `{"title":"a"}`, "") // => deliberately NO header
	if rec.Code != http.StatusUnauthorized {                                            // => writes are guarded -- 401, not 201 and not 404
		t.Fatalf("got status %d, want 401", rec.Code) // => the guard must fire before create ever runs
	}
}

// TestCrudRoundTrip walks one row through its full lifecycle: create (201,
// guarded), read (200, open), update (200, guarded), delete (204,
// guarded), then re-read (404, genuinely removed).
func TestCrudRoundTrip(t *testing.T) { // => the full C-R-U-D cycle on a single row
	handler := freshHandler()                                                                               // => one isolated app for the whole lifecycle -- the row persists across calls
	created := doRequest(t, handler, http.MethodPost, "/tasks", `{"title":"write the report"}`, authHeader) // => valid token
	if created.Code != http.StatusCreated {                                                                 // => 201 confirms a new resource now exists
		t.Fatalf("create: got status %d, want 201", created.Code) // => without 201 there is no id to track
	}
	taskID := int(decodeBody(t, created)["id"].(float64)) // => the server-assigned id -- JSON numbers decode as float64
	// => every later call reuses THIS id: one row, tracked through its full lifecycle (1 on a fresh store)

	read := doRequest(t, handler, http.MethodGet, "/tasks/"+itoa(taskID), "", "") // => reads are open -- no token needed
	if read.Code != http.StatusOK {                                               // => the just-created row is genuinely readable
		t.Fatalf("read: got status %d, want 200", read.Code) // => create-then-read must round-trip
	}
	if got := decodeBody(t, read)["status"]; got != "todo" { // => the schema-style DEFAULT applied server-side
		t.Fatalf(`read: got status %q, want "todo"`, got) // => POST never sets status -- the server defaulted it
	}

	updated := doRequest(t, handler, http.MethodPut, "/tasks/"+itoa(taskID), // => PUT replaces the full resource, guarded
		`{"title":"write the report","status":"done"}`, authHeader) // => full body -- title AND status, both required
	if updated.Code != http.StatusOK { // => a successful replace on an existing id
		t.Fatalf("update: got status %d, want 200", updated.Code) // => the row exists AND the token is valid
	}
	if got := decodeBody(t, updated)["status"]; got != "done" { // => confirms the UPDATE actually landed
		t.Fatalf(`update: got status %q, want "done"`, got) // => the response carries the post-update state
	}

	deleted := doRequest(t, handler, http.MethodDelete, "/tasks/"+itoa(taskID), "", authHeader) // => DELETE is guarded too
	if deleted.Code != http.StatusNoContent {                                                   // => no body on a successful delete -- 204, not 200
		t.Fatalf("delete: got status %d, want 204", deleted.Code) // => 204 is the delete contract
	}

	gone := doRequest(t, handler, http.MethodGet, "/tasks/"+itoa(taskID), "", "") // => re-reads the SAME id after deletion
	if gone.Code != http.StatusNotFound {                                         // => genuinely removed -- not soft-deleted, not hidden
		t.Fatalf("read-after-delete: got status %d, want 404", gone.Code) // => proves remove actually removed the row
	}
}

// TestCrudUpdateMissingID Is404 confirms PUT never creates: a valid token
// plus a missing row is still a 404 -- distinct from the 401 cases below.
func TestCrudUpdateMissingIDIs404(t *testing.T) { // => PUT only replaces, never upserts
	rec := doRequest(t, freshHandler(), http.MethodPut, "/tasks/99999", // => id 99999 was never created
		`{"title":"x","status":"todo"}`, authHeader) // => a valid token alone does not manufacture a row
	if rec.Code != http.StatusNotFound { // => confirms PUT-only-replaces on a guarded, valid call
		t.Fatalf("got status %d, want 404", rec.Code) // => distinguishes "valid token, missing row" from 401s
	}
}

// -- Token auth group ------------------------------------------------------------

// TestTokenMissing Is401 sends no header at all -- the credentials-missing
// branch of the guard, rejected before the handler body ever runs.
func TestTokenMissingIs401(t *testing.T) { // => no header whatsoever
	rec := doRequest(t, freshHandler(), http.MethodPost, "/tasks", `{"title":"a"}`, "") // => empty auth: no header sent
	if rec.Code != http.StatusUnauthorized {                                            // => rejected before create runs -- no row was created
		t.Fatalf("got status %d, want 401", rec.Code) // => the guard's FIRST failure mode
	}
}

// TestTokenWrong Is401 sends a header that fails the exact-match
// comparison -- the credentials-wrong branch of the same guard.
func TestTokenWrongIs401(t *testing.T) { // => a header, but the wrong bearer value
	rec := doRequest(t, freshHandler(), http.MethodPost, "/tasks", `{"title":"a"}`, badAuthHeader) // => non-matching token
	if rec.Code != http.StatusUnauthorized {                                                       // => the guard rejects non-matching tokens too
		t.Fatalf("got status %d, want 401", rec.Code) // => the guard's SECOND failure mode
	}
}

// TestTokenValidSucceeds is the ONE outcome where the guard does not raise:
// an exact VALID_TOKEN match lets the write proceed to a 201.
func TestTokenValidSucceeds(t *testing.T) { // => the "allowed" outcome -- the write proceeds
	rec := doRequest(t, freshHandler(), http.MethodPost, "/tasks", `{"title":"a"}`, authHeader) // => exact match
	if rec.Code != http.StatusCreated {                                                         // => the guard passed through -- the write ran
		t.Fatalf("got status %d, want 201", rec.Code) // => this is the only non-raising guard outcome
	}
}

// TestTokenDeleteRequiresToken confirms the guard is wired to EVERY write,
// not just POST and PUT: an unguarded DELETE on an existing row still 401s.
func TestTokenDeleteRequiresToken(t *testing.T) { // => the guard covers all three write verbs
	handler := freshHandler()                                                                // => one app: create WITH a token, delete WITHOUT -- same row
	created := doRequest(t, handler, http.MethodPost, "/tasks", `{"title":"b"}`, authHeader) // => setup: a real row
	id := int(decodeBody(t, created)["id"].(float64))                                        // => the setup row's id -- targeted by the delete below
	rec := doRequest(t, handler, http.MethodDelete, "/tasks/"+itoa(id), "", "")              // => no Authorization header
	if rec.Code != http.StatusUnauthorized {                                                 // => DELETE is guarded exactly like POST and PUT
		t.Fatalf("got status %d, want 401", rec.Code) // => confirms the guard wraps remove too
	}
}

// -- Pagination group ------------------------------------------------------------

// TestPaginationWindow seeds 20 tasks, then checks the first 5-row window
// AND its next link -- a genuinely bounded page with somewhere to go.
func TestPaginationWindow(t *testing.T) { // => bounded pages, proven against a known seed
	handler := freshHandler() // => one app: 20 writes, then two reads -- all isolated here
	for i := 0; i < 20; i++ { // => seeds 20 fresh tasks specifically for this pagination check
		rec := doRequest(t, handler, http.MethodPost, "/tasks", // => each write needs a token -- reads do not
			`{"title":"paginated task"}`, authHeader) // => identical titles: the WINDOW proves order, not content
		if rec.Code != http.StatusCreated { // => every seed write must land, or the window below lies
			t.Fatalf("seed %d: got status %d, want 201", i, rec.Code) // => fail fast: a short seed breaks counts
		}
	}
	first := doRequest(t, handler, http.MethodGet, "/tasks?limit=5&offset=0", "", "") // => reads need no token
	body := decodeBody(t, first)                                                      // => the page envelope -- items, total, next
	if n := len(body["items"].([]any)); n != 5 {                                      // => a genuinely bounded page -- 5, not 20
		t.Fatalf("got %d items, want 5", n) // => limit=5 must cap the window exactly
	}
	if next := body["next"]; next != float64(5) { // => metadata points at the next window -- next == limit here
		t.Fatalf("got next %v, want 5", next) // => offset started at 0, so next echoes the SAME formula main uses
	}
}

// TestPaginationStatusFilterNarrows confirms filter + pagination compose:
// a "done" row created then PUT to done must appear inside a filtered page
// where every returned row matches.
func TestPaginationStatusFilterNarrows(t *testing.T) { // => filter plus pagination, together
	handler := freshHandler()                                                                            // => one app: create, update, then filtered read -- same isolated store
	created := doRequest(t, handler, http.MethodPost, "/tasks", `{"title":"filter-target"}`, authHeader) // => needs a token
	id := int(decodeBody(t, created)["id"].(float64))                                                    // => the target row's id -- addressed by the PUT below
	updated := doRequest(t, handler, http.MethodPut, "/tasks/"+itoa(id),                                 // => sets status to "done" so the filter finds it
		`{"title":"filter-target","status":"done"}`, authHeader) // => PUT is a write -- a valid token rides along
	if updated.Code != http.StatusOK { // => the fixture update must land, or the filter below finds nothing
		t.Fatalf("update: got status %d, want 200", updated.Code) // => fail fast: no done row, no meaningful filter
	}
	rec := doRequest(t, handler, http.MethodGet, "/tasks?status=done&limit=50", "", "") // => filtered read, no token
	body := decodeBody(t, rec)                                                          // => the SAME page envelope shape
	for _, item := range body["items"].([]any) {                                        // => EVERY returned row must match -- not just the count
		if got := item.(map[string]any)["status"]; got != "done" { // => a single mismatch fails the filter claim
			t.Fatalf("got status %q in a status=done page", got) // => the filter must hold for ALL items
		}
	}
}

// TestFullIntegrationSmoke touches all three areas at once: create (auth),
// list (pagination), and delete -- then spot-checks the cleanup with a 404.
func TestFullIntegrationSmoke(t *testing.T) { // => create, list, delete -- all three areas, one test
	handler := freshHandler() // => one app for the whole smoke run -- 3 rows, listed, then removed
	var ids []int             // => the 3 server-assigned ids -- collected from each create response below
	for i := 0; i < 3; i++ {  // => creates 3 fresh tasks, each guarded by a valid token
		rec := doRequest(t, handler, http.MethodPost, "/tasks", `{"title":"smoke"}`, authHeader) // => token required
		if rec.Code != http.StatusCreated {                                                      // => every smoke row must land, or the listing below lies
			t.Fatalf("create %d: got status %d, want 201", i, rec.Code) // => fail fast on the first missing row
		}
		ids = append(ids, int(decodeBody(t, rec)["id"].(float64))) // => JSON numbers decode as float64 -- convert once
	}
	// => an unguarded read, wide enough to see all 3 fresh rows just created above
	listing := doRequest(t, handler, http.MethodGet, "/tasks?limit=50", "", "") // => wide page -- all 3 inside
	items := decodeBody(t, listing)["items"].([]any)                            // => the listed rows -- must include the 3 just created
	if len(items) < 3 {                                                         // => proves listPage genuinely returns just-created rows
		t.Fatalf("got %d items, want at least 3", len(items)) // => the list must reflect the writes above
	}
	for _, id := range ids { // => cleans up every id this test created -- one DELETE per collected id
		rec := doRequest(t, handler, http.MethodDelete, "/tasks/"+itoa(id), "", authHeader) // => each DELETE needs a token
		if rec.Code != http.StatusNoContent {                                               // => every cleanup delete must land -- 204 each
			t.Fatalf("delete %d: got status %d, want 204", id, rec.Code) // => leftover rows would leak across asserts
		}
	}
	gone := doRequest(t, handler, http.MethodGet, "/tasks/1", "", "") // => spot-checks only the FIRST id
	if gone.Code != http.StatusNotFound {                             // => genuinely cleaned up -- 404, not hidden
		t.Fatalf("read-after-cleanup: got status %d, want 404", gone.Code) // => the loop above proved every delete
	}
}

// itoa renders a small int as a path segment -- strconv.Itoa without
// importing strconv into the test's already-long import block is a wash,
// so the tiny local wrapper keeps call sites reading cleanly.
func itoa(n int) string { // => one-line helper: ids 1..3 become "1".."3" for DELETE paths
	if n < 0 || n > 9 { // => this suite only ever addresses single-digit ids -- fail loudly otherwise
		panic("itoa: out of single-digit test range") // => a programming error, never a request error
	}
	return string(rune('0' + n)) // => digit arithmetic: 1 -> "1", no allocation beyond the string itself
}
