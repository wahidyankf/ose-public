package application

import (
	"fmt"
	"io/fs"
	"path/filepath"
	"strings"

	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/content"
	"github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/finding"
)

// codeRoots are the course-relative folders below which Markdown is course
// code, never a lesson. They mirror the layout discovery roots and the sync
// check; the merge may export one shared source.
var codeRoots = []string{"learning/code", "drilling/code", "learning/capstone/code"}

// SyncRequest selects the courses to sync: named courses sync as if opted
// in, otherwise every opted-in course, or every course with IncludeInert.
// Write repairs anchored fences from their files before the check decides
// the findings. ContentDir names the content root on disk, so repairs land
// in real files; checks alone need only Content.
type SyncRequest struct {
	Content      fs.FS
	ContentDir   string
	Courses      []string
	IncludeInert bool
	Write        bool
}

// Sync checks the selected courses and returns every sync finding in course,
// path, line, and code order. With Write, stale anchored fences are repaired
// first and the findings describe what remains.
func Sync(req SyncRequest) ([]finding.Finding, error) {
	courses, err := selectCourses(req.Content, req.Courses, req.IncludeInert)
	if err != nil {
		return nil, err
	}
	var findings []finding.Finding
	for _, course := range courses {
		courseFindings, courseErr := syncCourse(req, course)
		if courseErr != nil {
			return nil, courseErr
		}
		findings = append(findings, courseFindings...)
	}
	sortFindings(findings)
	return findings, nil
}

// syncCourse checks one course, repairing its anchored fences first when
// asked. The check after a repair decides the exit status: a fully repaired
// course reports no finding.
func syncCourse(req SyncRequest, course string) ([]finding.Finding, error) {
	sub, err := fs.Sub(req.Content, course)
	if err != nil {
		return nil, fmt.Errorf("application: open course %q: %w", course, err)
	}
	if req.Write {
		if err := rewriteCourse(req, course, sub); err != nil {
			return nil, err
		}
	}
	return content.Check(course, sub), nil
}

// rewriteCourse copies target bytes into every stale anchored fence of one
// course. Lessons the check never reads stay untouched, and files without
// anchors rewrite to themselves, so only real repairs reach the disk.
func rewriteCourse(req SyncRequest, course string, sub fs.FS) error {
	updates := map[string][]byte{}
	for _, lesson := range lessonFiles(sub) {
		data, err := fs.ReadFile(sub, lesson)
		if err != nil {
			continue
		}
		resolve := func(target string) ([]byte, bool) {
			targetData, readErr := fs.ReadFile(sub, target)
			if readErr != nil {
				return nil, false
			}
			return targetData, true
		}
		if revised, changed := content.RewriteLesson(string(data), resolve); changed {
			updates[lesson] = []byte(revised)
		}
	}
	if len(updates) == 0 {
		return nil
	}
	if req.ContentDir == "" {
		return &finding.Error{
			Code:    finding.UsageInvalidArguments,
			Message: "sync --write needs a content directory",
		}
	}
	if err := content.WriteUpdates(filepath.Join(req.ContentDir, course), updates); err != nil {
		return fmt.Errorf("application: write lessons for course %q: %w", course, err)
	}
	return nil
}

// lessonFiles lists every course Markdown file outside the code folders in
// lexical order: the same lessons the sync check reads.
func lessonFiles(sub fs.FS) []string {
	var lessons []string
	_ = fs.WalkDir(sub, ".", func(route string, entry fs.DirEntry, err error) error {
		if err == nil && !entry.IsDir() && strings.HasSuffix(entry.Name(), ".md") && !underCodeRoot(route) {
			lessons = append(lessons, route)
		}
		return nil
	})
	return lessons
}

// underCodeRoot reports whether a course-relative path sits below a code
// folder, where Markdown is course code and never a lesson.
func underCodeRoot(route string) bool {
	for _, root := range codeRoots {
		if route == root || strings.HasPrefix(route, root+"/") {
			return true
		}
	}
	return false
}
