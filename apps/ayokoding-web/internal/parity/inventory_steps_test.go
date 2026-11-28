package parity

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/fs"
	"slices"
	"testing"
)

func TestReadInventoryInputsReadsBothFilesThroughTheHost(t *testing.T) {
	files := map[string]string{"/repo/sitemap.xml": "<urlset/>", "/repo/export.json": "[]"}
	host, _, _, _ := fakeHost(files, nil)
	inputs, err := readInventoryInputs(host, "/repo", "sitemap.xml", "export.json")
	if err != nil {
		t.Fatalf("readInventoryInputs: %v", err)
	}
	if string(inputs.sitemap) != "<urlset/>" || string(inputs.export) != "[]" {
		t.Fatalf("inputs = %q and %q, want the sitemap and the export", inputs.sitemap, inputs.export)
	}
}

func TestReadInventoryInputsKeepsAbsolutePaths(t *testing.T) {
	files := map[string]string{"/elsewhere/sitemap.xml": "<urlset/>", "/elsewhere/export.json": "[]"}
	host, _, _, _ := fakeHost(files, nil)
	inputs, err := readInventoryInputs(host, "/repo", "/elsewhere/sitemap.xml", "/elsewhere/export.json")
	if err != nil {
		t.Fatalf("readInventoryInputs with absolute paths: %v", err)
	}
	if string(inputs.sitemap) != "<urlset/>" {
		t.Fatalf("sitemap = %q, want the file at the absolute path", inputs.sitemap)
	}
}

func TestReadInventoryInputsNamesEachMissingFile(t *testing.T) {
	onlyExport, _, _, _ := fakeHost(map[string]string{"/repo/export.json": "[]"}, nil)
	if _, err := readInventoryInputs(onlyExport, "/repo", "sitemap.xml", "export.json"); !errors.Is(err, fs.ErrNotExist) {
		t.Fatalf("missing sitemap: err = %v, want fs.ErrNotExist", err)
	}
	onlySitemap, _, _, _ := fakeHost(map[string]string{"/repo/sitemap.xml": "<urlset/>"}, nil)
	if _, err := readInventoryInputs(onlySitemap, "/repo", "sitemap.xml", "export.json"); !errors.Is(err, fs.ErrNotExist) {
		t.Fatalf("missing export: err = %v, want fs.ErrNotExist", err)
	}
}

func TestExpandRoutesListsThePatternsOfTheRouteTree(t *testing.T) {
	host, _, _, _ := fakeHost(nil, nil)
	patterns, err := expandRoutes(host, "/repo", "apps/ayokoding-www/src/app")
	if err != nil {
		t.Fatalf("expandRoutes: %v", err)
	}
	slices.Sort(patterns)
	want := []string{"/en", "/en/browse", "/id", "/id/browse"}
	if !slices.Equal(patterns, want) {
		t.Fatalf("patterns = %q, want %q", patterns, want)
	}
}

func TestExpandRoutesReportsAnUnreadableRouteTree(t *testing.T) {
	host, _, _, _ := fakeHost(nil, nil)
	host.Sub = func(string) fs.FS { return failingFS{} }
	if _, err := expandRoutes(host, "/repo", "apps/ayokoding-www/src/app"); err == nil {
		t.Fatal("unreadable route tree returned no error")
	}
}

func TestEncodeInventoryWritesIndentedJSONWithAFinalNewline(t *testing.T) {
	inventory := Inventory{SourceRevision: "abc123", URLs: []string{"/en"}, Redirects: []Redirect{}}
	data := encodeInventory(inventory)
	if !bytes.HasSuffix(data, []byte("}\n")) {
		t.Fatalf("encoded inventory does not end with a closing brace and a newline: %q", data)
	}
	if !bytes.Contains(data, []byte("\n  \"urls\"")) {
		t.Fatalf("encoded inventory is not indented by two spaces: %s", data)
	}
	var back Inventory
	if err := json.Unmarshal(data, &back); err != nil {
		t.Fatalf("encoded inventory is not JSON: %v", err)
	}
	if back.SourceRevision != "abc123" || !slices.Equal(back.URLs, []string{"/en"}) {
		t.Fatalf("decoded inventory = %+v, want the encoded values", back)
	}
}

func TestEmitInventoryWritesToStdoutWithoutAnOutFile(t *testing.T) {
	host, stdout, _, written := fakeHost(nil, nil)
	if err := emitInventory(host, "/repo", "", []byte("{}\n")); err != nil {
		t.Fatalf("emitInventory to stdout: %v", err)
	}
	if stdout.String() != "{}\n" {
		t.Fatalf("stdout = %q, want the encoded inventory", stdout.String())
	}
	if len(written) != 0 {
		t.Fatalf("wrote files %v, want none when no out file is named", written)
	}
}

func TestEmitInventoryReportsAFailedStdoutWrite(t *testing.T) {
	host, _, _, _ := fakeHost(nil, nil)
	host.Stdout = failingWriter{}
	if err := emitInventory(host, "/repo", "", []byte("{}\n")); err == nil {
		t.Fatal("failed stdout write returned no error")
	}
}

func TestEmitInventoryWritesTheOutFileAgainstTheRepositoryRoot(t *testing.T) {
	host, _, _, written := fakeHost(nil, nil)
	if err := emitInventory(host, "/repo", "out/inventory.json", []byte("{}\n")); err != nil {
		t.Fatalf("emitInventory to a file: %v", err)
	}
	if written["/repo/out/inventory.json"] != "{}\n" {
		t.Fatalf("written = %v, want the inventory at the root-relative path", written)
	}
}

func TestEmitInventoryKeepsAnAbsoluteOutPath(t *testing.T) {
	host, _, _, written := fakeHost(nil, nil)
	if err := emitInventory(host, "/repo", "/tmp/inventory.json", []byte("{}\n")); err != nil {
		t.Fatalf("emitInventory to an absolute path: %v", err)
	}
	if _, ok := written["/tmp/inventory.json"]; !ok {
		t.Fatalf("written = %v, want the inventory at the absolute path", written)
	}
}

func TestEmitInventoryReportsAFailedFileWrite(t *testing.T) {
	host, _, _, _ := fakeHost(nil, nil)
	host.WriteFile = func(string, []byte, fs.FileMode) error { return errors.New("disk full") }
	if err := emitInventory(host, "/repo", "inventory.json", []byte("{}\n")); err == nil {
		t.Fatal("failed file write returned no error")
	}
}
