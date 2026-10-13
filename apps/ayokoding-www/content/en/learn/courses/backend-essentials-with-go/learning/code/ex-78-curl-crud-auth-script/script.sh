#!/usr/bin/env bash
# Example 78: a documented curl sequence exercising CRUD + auth end to end.
# Run against a live server: go run . (from this directory -- 127.0.0.1:8000).
# Mirrors every step of the test below, so the script and the Go test can
# never drift apart without someone noticing.
set -euo pipefail # => abort on any failing command, unset var, or pipe error -- set -u is mandatory

BASE_URL="http://127.0.0.1:8000" # => the target server this script drives end to end
TOKEN="s3cr3t-token-abc123"      # => matches main.go's validToken -- the SAME literal both sides expect

echo "== Step 1: create WITHOUT a token -- expect 401 ==" # => no Authorization header at all
# => captures ONLY the HTTP status code, discarding the response body via -o /dev/null
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Content-Type: application/json" \
	-d '{"title":"write the report"}' "$BASE_URL/tasks") # => POST with no Authorization header
echo "status: $code"                                  # => prints the captured status for a human reader
test "$code" = "401"                                  # => aborts the script (set -e) if this assertion fails

echo "== Step 2: create WITH a valid token -- expect 201 ==" # => the SAME create, now WITH a token
# => this time the FULL response body is captured, not just the status
create_response=$(curl -s -X POST -H "Content-Type: application/json" \
	-H "Authorization: Bearer $TOKEN" -d '{"title":"write the report"}' "$BASE_URL/tasks")              # => guarded write, valid token
echo "$create_response"                                                                              # => prints the raw JSON so the created id is visible
task_id=$(echo "$create_response" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])') # => extracts "id"
echo "created task id: $task_id"                                                                     # => the id every remaining step operates on

echo "== Step 3: read the created task (no token needed) -- expect 200 ==" # => reads stay OPEN
curl -s -i "$BASE_URL/tasks/$task_id"                                      # => -i prints headers too, not just the body
echo                                                                       # => a blank line between this step and the next

echo "== Step 4: update WITH a valid token -- expect 200, status becomes done ==" # => PUT replaces the full resource
# => PUT is guarded the same way POST was in Step 2
curl -s -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
	-d '{"title":"write the report","status":"done"}' "$BASE_URL/tasks/$task_id" # => full-body replace
echo                                                                          # => separates this step's JSON from the next header

echo "== Step 5: delete WITH a valid token -- expect 204 ==" # => DELETE is guarded too
# => DELETE carries no body -- only the status code is captured
code=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -H "Authorization: Bearer $TOKEN" \
	"$BASE_URL/tasks/$task_id") # => the same task_id created back in Step 2
echo "status: $code"         # => prints the captured DELETE status code
test "$code" = "204"         # => 204 means success with no response body

echo "== Step 6: read after delete -- expect 404 (genuinely gone) =="     # => proves the row is truly gone
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/tasks/$task_id") # => the same unguarded GET as Step 3
echo "status: $code"                                                      # => prints the captured final status code
test "$code" = "404"                                                      # => confirms genuine removal, not a soft-delete

echo "== ALL STEPS PASSED ==" # => only reached if every test assertion above succeeded (set -e)
