package content_test

import (
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/content"
)

// A course overview is served at the course route, and a nested overview keeps its own route.
func TestRenderPageCourseOverviewLinkTargetsTheCourseRoute(t *testing.T) {
	body := content.RenderPage("[Other course](../../other/overview.md)\n", lessonContext).HTML
	if !strings.Contains(body, `href="/en/learn/courses/other"`) {
		t.Fatalf("course overview link does not target the course route: %q", body)
	}
}

func TestRenderPageNestedOverviewLinkKeepsItsOwnRoute(t *testing.T) {
	body := content.RenderPage("[Capstone](./capstone/overview.md)\n", lessonContext).HTML
	if !strings.Contains(body, `href="/en/learn/courses/web/learning/capstone/overview"`) {
		t.Fatalf("nested overview link lost its route: %q", body)
	}
}
