package docs

import "testing"

func TestCategorizeBrokenLink(t *testing.T) {
	tests := []struct {
		name string
		link string
		want string
	}{
		// Old ex-ru-* prefixes
		{
			name: "ex-ru- prefix",
			link: "../old/ex-ru-naming.md",
			want: "Old ex-ru-* prefixes",
		},
		{
			name: "ex__ru__ prefix",
			link: "./ex__ru__pattern.md",
			want: "Old ex-ru-* prefixes",
		},

		// workflows/ paths
		{
			name: "workflows/ path",
			link: "../../workflows/deployment.md",
			want: "workflows/ paths",
		},
		{
			name: "governance/workflows/ should NOT match",
			link: "../../governance/workflows/deployment.md",
			want: "General/other paths",
		},

		// vision/ paths
		{
			name: "vision/ path",
			link: "../../vision/mission.md",
			want: "vision/ paths",
		},
		{
			name: "governance/vision/ should NOT match",
			link: "../../governance/vision/mission.md",
			want: "General/other paths",
		},

		// conventions README
		{
			name: "conventions README",
			link: "../conventions/README.md",
			want: "conventions README",
		},
		{
			name: "conventions README nested",
			link: "../../governance/conventions/README.md",
			want: "conventions README",
		},

		// Missing files
		{
			name: "CODE_OF_CONDUCT.md",
			link: "CODE_OF_CONDUCT.md",
			want: "Missing files",
		},
		{
			name: "CHANGELOG.md",
			link: "CHANGELOG.md",
			want: "Missing files",
		},

		// General/other
		{
			name: "Random missing file",
			link: "../docs/missing.md",
			want: "General/other paths",
		},
		{
			name: "Another random path",
			link: "./some/path/file.md",
			want: "General/other paths",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CategorizeBrokenLink(tt.link)
			if got != tt.want {
				t.Errorf("CategorizeBrokenLink(%q) = %q, want %q", tt.link, got, tt.want)
			}
		})
	}
}
