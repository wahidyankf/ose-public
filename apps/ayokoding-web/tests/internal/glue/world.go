package glue

import (
	"net/http"
	"testing/fstest"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/web"
)

// World carries one scenario from Given through Then.
type World struct {
	adapter         string
	cfg             web.Config
	handler         http.Handler
	env             map[string]string
	args            []string
	status          int
	header          http.Header
	body            string
	requests        []recordedRequest
	resolvedPort    int
	listenerStarted bool
	startErr        error
	// baseURL routes client calls to a scenario server; empty means the
	// in-process handler (unit).
	baseURL string
	// stops cleans up scenario-owned servers and stubs.
	stops []func()
	// external records coexistence listeners (unit fakes, integration stubs).
	external map[int]bool
	// progress browser doubles: rewrite origin, existing-site origin, and
	// unrelated site settings that reset must preserve.
	progress         *progressDouble
	existingProgress *progressDouble
	settings         map[string]string
	progressPage     string
	focus            string
	// tool journey state.
	journey string
	// path journey state.
	pathID      string
	courseID    string
	history     []string
	r6FirstBody string
	// search journey state.
	searchOpen   bool
	searchQuery  string
	searchPicked string
	// shell journey state.
	locale        string
	theme         string
	sidebarWidth  int
	mobileNavOpen bool
	viewportWidth string
	// content journey state.
	diagnostic string
	shortcode  string
	clipboard  string
	// local-dev journey state.
	flagPort string
	hashes   map[string]string
	// learn-entry page and htmx fragment replies of the current scenario.
	learnPage string
	fragments []fragmentReply
	// portSeq numbers the unit adapter's free ports; corpusSeq numbers its
	// in-memory corpus roots; unitTree holds those roots (unit adapter only).
	portSeq   int
	corpusSeq int
	unitTree  fstest.MapFS
}

// NewWorld builds the per-scenario state for the named adapter. The default
// configuration is resolved from an empty scenario record, never the process.
func NewWorld(adapter string) *World {
	cfg, err := web.ResolveConfig(nil, scenarioEnvironment(nil))
	if err != nil {
		panic("glue: the empty launcher configuration must resolve: " + err.Error())
	}
	cfg.Port = web.DefaultPort
	deps := web.SeedFixtureDeps("parity", web.CannedSources)
	return &World{
		unitTree:         fstest.MapFS{},
		adapter:          adapter,
		cfg:              cfg,
		handler:          web.NewServer(cfg, deps).Handler(),
		env:              map[string]string{},
		external:         map[int]bool{},
		progress:         newProgressDouble(),
		existingProgress: newProgressDouble(),
		settings:         map[string]string{"theme": "light", "ayokoding-sidebar-width": "240"},
		locale:           "en",
		theme:            "light",
		sidebarWidth:     240,
	}
}
