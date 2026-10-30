# E2E fixtures

Suite-owned inputs for the browser scenarios. The Go server under test serves
the parity fixture corpus (`AYOKODING_WEB_FIXTURE=parity`), never a
developer's working tree; these files are the only content the suite writes
for itself.

- `progress-records.json` — browser progress records for the storage
  scenarios: a valid v1 record, an invalid raw value, and a wrong-version
  record. Steps parse them through the app's own progress helpers before
  writing them to the test origin's localStorage.
