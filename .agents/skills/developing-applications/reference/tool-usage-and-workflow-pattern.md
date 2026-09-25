# Common Development Workflow — Tool Usage and Development Workflow Pattern

## Tool Usage for Developers

**Standard Developer Tools**: read, write, edit, glob, grep, bash

**Tool Purposes**:

- **read**: Load source files and documentation for analysis
- **write**: Create new source files and test files
- **edit**: Modify existing code files
- **glob**: Discover files matching patterns
- **grep**: Search code patterns across files
- **bash**: Execute language tooling, run tests, git operations

**Tool Selection Guidance**:

- Use **read** for understanding existing code and documentation
- Use **write** for creating new files from scratch
- Use **edit** for modifying existing files (preferred over write for changes)
- Use **glob** for file discovery (NOT bash find)
- Use **grep** for content search (NOT bash grep)
- Use **bash** for running compilers, test runners, build tools, git commands

## Development Workflow Pattern

### Standard 6-Step Workflow

Every code change follows this pattern:

1. **Requirements Analysis**: Understand functional and technical requirements
2. **Design**: Apply appropriate patterns and platform architecture
3. **Implementation**: Write clean, tested, documented code
4. **Testing**: Comprehensive unit, integration, and e2e tests
5. **Code Review**: Self-review against coding standards
6. **Documentation**: Update relevant docs and code comments

### Implementation Philosophy

**Make it work → Make it right → Make it fast**

1. **Make it work**: Get basic functionality working (passing tests)
2. **Make it right**: Refactor for clarity, follow standards, eliminate duplication
3. **Make it fast**: Optimize performance where needed (measure first)

**Avoid**:

- Premature optimization (fast before right)
- Over-engineering (complex before simple)
- Skipping tests (work without validation)
