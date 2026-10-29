package glue

import (
	"encoding/json"
	"sort"
	"strings"
)

// progressKey is the browser-only learning record. It never travels in an
// HTTP request; the Go double mirrors the assets/js/progress.js semantics so
// godog unit steps can assert the lifecycle without a browser.
const progressKey = "ayokoding-learn-progress-v1"

// progressRecord is the strict v1 schema.
type progressRecord struct {
	Version    int      `json:"version"`
	Completed  []string `json:"completed"`
	LastPath   string   `json:"lastPath"`
	LastCourse string   `json:"lastCourse"`
}

// progressDouble is the in-memory browser double. Blocked storage keeps a
// visit-only memory and reports a notice instead of persisting.
type progressDouble struct {
	store   map[string]string
	visit   map[string]string
	blocked bool
	notice  string
}

func newProgressDouble() *progressDouble {
	return &progressDouble{store: map[string]string{}, visit: map[string]string{}}
}

func emptyProgressRecord() progressRecord {
	return progressRecord{Version: 1, Completed: []string{}}
}

// serialize renders the record deterministically for comparisons.
func serialize(record progressRecord) string {
	completed := append([]string{}, record.Completed...)
	sort.Strings(completed)
	raw, err := json.Marshal(progressRecord{
		Version:    record.Version,
		Completed:  completed,
		LastPath:   record.LastPath,
		LastCourse: record.LastCourse,
	})
	if err != nil {
		return ""
	}
	return string(raw)
}

// load reads the stored record, recovering to an empty valid state when the
// stored value is invalid and storage is available.
func (d *progressDouble) load() progressRecord {
	raw, ok := d.store[progressKey]
	if !ok {
		return emptyProgressRecord()
	}
	var record progressRecord
	decoder := json.NewDecoder(strings.NewReader(raw))
	if err := decoder.Decode(&record); err != nil {
		return emptyProgressRecord()
	}
	if record.Version != 1 {
		return emptyProgressRecord()
	}
	for _, page := range record.Completed {
		if page == "" {
			return emptyProgressRecord()
		}
	}
	return record
}

// save persists the record unless storage is blocked.
func (d *progressDouble) save(record progressRecord) {
	if d.blocked {
		d.visit[progressKey] = serialize(record)
		d.notice = "progress cannot be saved in this browser"
		return
	}
	d.store[progressKey] = serialize(record)
}

// mark idempotently completes one page.
func (d *progressDouble) mark(page string) progressRecord {
	record := d.load()
	for _, done := range record.Completed {
		if done == page {
			return record
		}
	}
	record.Completed = append(record.Completed, page)
	d.save(record)
	return record
}

// unmark removes one page from the completed set.
func (d *progressDouble) unmark(page string) progressRecord {
	record := d.load()
	kept := record.Completed[:0]
	for _, done := range record.Completed {
		if done != page {
			kept = append(kept, done)
		}
	}
	record.Completed = kept
	d.save(record)
	return record
}

// clear removes only the progress key.
func (d *progressDouble) clear() {
	delete(d.store, progressKey)
}

// visitCompleted reads visit-only progress when storage is blocked.
func (d *progressDouble) visitCompleted() []string {
	raw, ok := d.visit[progressKey]
	if !ok {
		return nil
	}
	var record progressRecord
	if err := json.Unmarshal([]byte(raw), &record); err != nil {
		return nil
	}
	return record.Completed
}

// storedRaw exposes the committed record for assertions.
func (d *progressDouble) storedRaw() string {
	return d.store[progressKey]
}

// privacyViolation scans recorded requests for a leaked progress record.
func privacyViolation(requests []recordedRequest) error {
	for _, request := range requests {
		if strings.Contains(request.target, "completed") || strings.Contains(request.body, "completed") {
			return fail("request %s %s carries the stored progress record", request.method, request.target)
		}
		if strings.Contains(request.target, progressKey) || strings.Contains(request.body, progressKey) {
			return fail("request %s %s carries the progress key", request.method, request.target)
		}
	}
	return nil
}
