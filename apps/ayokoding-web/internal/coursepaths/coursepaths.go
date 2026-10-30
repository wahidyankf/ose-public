package coursepaths

// Phase groups courses in manifest order. P2 fills variable-depth ID
// handling and transitional allowances behind these fields.
type Phase struct {
	Name    string
	Courses []string
}

// LearningPath is one roadmap. P2 fills manifest parsing behind it.
type LearningPath struct {
	ID       string
	Title    string
	Category string
	Phases   []Phase
}

// Course is one catalog entry.
type Course struct {
	ID            string
	Title         string
	Description   string
	Format        string
	Effort        string
	Category      string
	Outline       bool
	Prerequisites []string
}

// FakeStore is the P1H in-memory course-path double.
type FakeStore struct {
	paths     map[string]LearningPath
	order     []string
	courses   map[string]Course
	malformed []string
}

// NewFakeStore seeds the in-memory double.
func NewFakeStore(paths []LearningPath, courses []Course, malformed []string) *FakeStore {
	store := &FakeStore{
		paths:     map[string]LearningPath{},
		courses:   map[string]Course{},
		malformed: malformed,
	}
	for _, path := range paths {
		if _, exists := store.paths[path.ID]; !exists {
			store.order = append(store.order, path.ID)
		}
		store.paths[path.ID] = path
	}
	for _, course := range courses {
		store.courses[course.ID] = course
	}
	return store
}

// Paths lists valid paths; malformed files stay excluded.
func (s *FakeStore) Paths() []LearningPath {
	paths := make([]LearningPath, 0, len(s.order))
	for _, id := range s.order {
		paths = append(paths, s.paths[id])
	}
	return paths
}

// Path resolves one roadmap by ID.
func (s *FakeStore) Path(id string) (LearningPath, bool) {
	path, ok := s.paths[id]
	return path, ok
}

// Course resolves one catalog entry by ID.
func (s *FakeStore) Course(id string) (Course, bool) {
	course, ok := s.courses[id]
	return course, ok
}

// Prerequisites lists required courses with titles and canonical routes.
func (s *FakeStore) Prerequisites(courseID string) []Course {
	course, ok := s.courses[courseID]
	if !ok {
		return nil
	}
	var required []Course
	for _, id := range course.Prerequisites {
		if prerequisite, found := s.courses[id]; found {
			required = append(required, prerequisite)
		}
	}
	return required
}

// PathContains reports whether a path identifier is valid for a course.
func (s *FakeStore) PathContains(pathID, courseID string) bool {
	path, ok := s.paths[pathID]
	if !ok {
		return false
	}
	for _, phase := range path.Phases {
		for _, id := range phase.Courses {
			if id == courseID {
				return true
			}
		}
	}
	return false
}

// Diagnostics reports skipped malformed manifests.
func (s *FakeStore) Diagnostics() []string {
	return s.malformed
}
