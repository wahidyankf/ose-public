package coursepaths

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// manifestPhase is one roadmap phase in a path manifest file.
type manifestPhase struct {
	ID      string   `json:"id"`
	Title   string   `json:"title"`
	Name    string   `json:"name"`
	Courses []string `json:"courses"`
}

// manifestPath is one learning-path manifest file. Unknown fields carry
// transitional allowances the loader preserves by ignoring.
type manifestPath struct {
	PathID      string          `json:"pathId"`
	ID          string          `json:"id"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	Phases      []manifestPhase `json:"phases"`
}

// LoadDir builds a read-only path catalog from manifest JSON files without
// rewriting them. Variable-depth path identifiers stay intact and supply the
// category; phase order follows the manifest. Files with invalid JSON or
// without an identifier and phases are skipped with a diagnostic naming the
// relative path. Courses resolve through the composed catalog: manifests
// carry membership while course metadata arrives from the content tree, so
// the loader reports paths and the server seeds course entries separately.
func LoadDir(root string) (*FakeStore, error) {
	absolute, err := filepath.Abs(root)
	if err != nil {
		return nil, fmt.Errorf("coursepaths: resolve root: %w", err)
	}
	info, err := os.Stat(absolute)
	if err != nil {
		return nil, fmt.Errorf("coursepaths: read root: %w", err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("coursepaths: root %s is not a directory", root)
	}
	store := NewFakeStore(nil, nil, nil)
	var malformed []string
	var documents []string
	// The callback swallows every walk error, so WalkDir always reports nil;
	// the walkErr check below stays as a defensive totality guard.
	walkErr := filepath.WalkDir(absolute, func(path string, entry os.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return nil
		}
		if filepath.Ext(path) != ".json" {
			return nil
		}
		documents = append(documents, path)
		return nil
	})
	if walkErr != nil {
		return nil, fmt.Errorf("coursepaths: walk root: %w", walkErr)
	}
	sort.Strings(documents)
	for _, path := range documents {
		// WalkDir joins paths lexically, so the root prefix always holds.
		rel := strings.TrimPrefix(path, absolute+string(filepath.Separator))
		raw, err := os.ReadFile(path)
		if err != nil {
			malformed = append(malformed, "coursepaths: skipping unreadable manifest "+rel)
			continue
		}
		manifest := manifestPath{}
		if err := json.Unmarshal(raw, &manifest); err != nil {
			malformed = append(malformed, "coursepaths: skipping "+rel+": invalid JSON")
			continue
		}
		id := manifest.PathID
		if id == "" {
			id = manifest.ID
		}
		if id == "" {
			id = strings.TrimSuffix(filepath.Base(rel), ".json")
			if id == "" {
				malformed = append(malformed, "coursepaths: skipping "+rel+": missing path identifier")
				continue
			}
		}
		if len(manifest.Phases) == 0 {
			malformed = append(malformed, "coursepaths: skipping "+rel+": missing phases")
			continue
		}
		learningPath := LearningPath{ID: id, Title: manifest.Title}
		if learningPath.Title == "" {
			learningPath.Title = id
		}
		if slash := strings.Index(id, "/"); slash >= 0 {
			learningPath.Category = id[:slash]
		}
		for _, phase := range manifest.Phases {
			name := phase.Title
			if name == "" {
				name = phase.Name
			}
			if name == "" {
				name = phase.ID
			}
			learningPath.Phases = append(learningPath.Phases, Phase{Name: name, Courses: phase.Courses})
		}
		store.paths[id] = learningPath
		if !containsPath(store.order, id) {
			store.order = append(store.order, id)
		}
	}
	store.malformed = malformed
	return store, nil
}

// containsPath reports whether order already lists id.
func containsPath(order []string, id string) bool {
	for _, listed := range order {
		if listed == id {
			return true
		}
	}
	return false
}

// ActivePathContext reports whether pathID selects an active learning context
// for courseID: the identifier is present and the path claims the course.
// Anything else falls back to canonical course navigation.
func (s *FakeStore) ActivePathContext(pathID, courseID string) bool {
	return pathID != "" && s.PathContains(pathID, courseID)
}
