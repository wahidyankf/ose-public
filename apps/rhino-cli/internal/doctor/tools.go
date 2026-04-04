package doctor

import (
	"fmt"
	"path/filepath"
	"strings"
)

// toolDef describes how to check a single tool: what to run, how to parse the output,
// how to compare versions, and where to read the required version from.
type toolDef struct {
	name       string
	binary     string
	source     string
	args       []string
	useStderr  bool // true when the version info is on stderr (e.g. java -version)
	parseVer   func(output string) string
	compare    func(installed, required string) (ToolStatus, string)
	readReq    func() string // returns "" when there is no requirement
	installCmd InstallFunc   // nil = cannot auto-install
}

// parseTrimVersion normalizes output where the version string is the whole output
// (e.g. volta --version → "2.0.2\n", node --version → "v24.11.1\n").
func parseTrimVersion(s string) string {
	return normalizeSimpleVersion(strings.TrimSpace(s))
}

// buildToolDefs returns the ordered list of tools to check for the given repo root.
// To add a new tool, add a new entry to the slice below — no other file needs to change.
func buildToolDefs(repoRoot string) []toolDef {
	packageJSONPath := filepath.Join(repoRoot, "package.json")
	pomXMLPath := filepath.Join(repoRoot, "apps", "organiclever-be-jasb", "pom.xml")
	goModPath := filepath.Join(repoRoot, "apps", "rhino-cli", "go.mod")
	pythonVersionPath := filepath.Join(repoRoot, "apps", "a-demo-be-python-fastapi", ".python-version")
	toolVersionsPath := filepath.Join(repoRoot, ".tool-versions")
	globalJSONPath := filepath.Join(repoRoot, "apps", "a-demo-be-fsharp-giraffe", "global.json")
	pubspecPath := filepath.Join(repoRoot, "apps", "a-demo-fe-dart-flutterweb", "pubspec.yaml")
	cargoTomlPath := filepath.Join(repoRoot, "apps", "a-demo-be-rust-axum", "Cargo.toml")

	noReq := func() string { return "" }

	return []toolDef{
		// --- Core tools ---
		{
			name:     "git",
			binary:   "git",
			source:   "(no config file)",
			args:     []string{"--version"},
			parseVer: func(s string) string { return parseLineWord(s, "git version ", 2, "") },
			compare:  compareExact,
			readReq:  noReq,
			installCmd: func(req, platform string) []InstallStep {
				if platform == "darwin" {
					return []InstallStep{{Description: "Install Xcode Command Line Tools", Command: "xcode-select", Args: []string{"--install"}}}
				}
				return []InstallStep{{Description: "Install git", Command: "sudo", Args: []string{"apt-get", "install", "-y", "git"}}}
			},
		},
		{
			name:     "volta",
			binary:   "volta",
			source:   "(no config file)",
			args:     []string{"--version"},
			parseVer: parseTrimVersion,
			compare:  compareExact,
			readReq:  noReq,
			installCmd: func(req, platform string) []InstallStep {
				return []InstallStep{{Description: "Install Volta", Command: "bash", Args: []string{"-c", "curl https://get.volta.sh | bash"}}}
			},
		},
		{
			name:     "node",
			binary:   "node",
			source:   "package.json → volta.node",
			args:     []string{"--version"},
			parseVer: parseTrimVersion,
			compare:  compareExact,
			readReq:  func() string { v, _ := readNodeVersion(packageJSONPath); return v },
			installCmd: func(req, platform string) []InstallStep {
				return []InstallStep{{Description: fmt.Sprintf("Install Node.js %s via Volta", req), Command: "volta", Args: []string{"install", "node@" + req}}}
			},
		},
		{
			name:     "npm",
			binary:   "npm",
			source:   "package.json → volta.npm",
			args:     []string{"--version"},
			parseVer: parseTrimVersion,
			compare:  compareExact,
			readReq:  func() string { v, _ := readNpmVersion(packageJSONPath); return v },
			installCmd: func(req, platform string) []InstallStep {
				return []InstallStep{{Description: fmt.Sprintf("Install npm %s via Volta", req), Command: "volta", Args: []string{"install", "npm@" + req}}}
			},
		},
		{
			name:      "java",
			binary:    "java",
			source:    "apps/organiclever-be-jasb/pom.xml → <java.version>",
			args:      []string{"-version"},
			useStderr: true, // java -version writes to stderr, not stdout
			parseVer:  parseJavaVersion,
			compare:   compareMajor,
			readReq:   func() string { v, _ := readJavaVersion(pomXMLPath); return v },
			installCmd: func(req, platform string) []InstallStep {
				return []InstallStep{{Description: fmt.Sprintf("Install Java %s via SDKMAN", req), Command: "bash", Args: []string{"-c", "source \"$HOME/.sdkman/bin/sdkman-init.sh\" && sdk install java " + req + "-tem"}}}
			},
		},
		{
			name:     "maven",
			binary:   "mvn",
			source:   "(no config file)",
			args:     []string{"--version"},
			parseVer: func(s string) string { return parseLineWord(s, "Apache Maven ", 2, "") },
			compare:  compareExact,
			readReq:  noReq,
			installCmd: func(req, platform string) []InstallStep {
				return []InstallStep{{Description: "Install Maven via SDKMAN", Command: "bash", Args: []string{"-c", "source \"$HOME/.sdkman/bin/sdkman-init.sh\" && sdk install maven"}}}
			},
		},
		{
			name:     "golang",
			binary:   "go",
			source:   "apps/rhino-cli/go.mod → go directive",
			args:     []string{"version"},
			parseVer: func(s string) string { return parseLineWord(s, "go version ", 2, "go") },
			compare:  compareGTE,
			readReq:  func() string { v, _ := readGoVersion(goModPath); return v },
			installCmd: func(req, platform string) []InstallStep {
				if platform == "darwin" {
					return []InstallStep{{Description: "Install Go via Homebrew", Command: "brew", Args: []string{"install", "go"}}}
				}
				return []InstallStep{{Description: "Install Go from go.dev", Command: "bash", Args: []string{"-c", fmt.Sprintf("curl -L https://go.dev/dl/go%s.linux-amd64.tar.gz | sudo tar -xz -C /usr/local", req)}}}
			},
		},
		// --- Python ---
		{
			name:     "python",
			binary:   "python3",
			source:   "apps/a-demo-be-python-fastapi/.python-version",
			args:     []string{"--version"},
			parseVer: parsePythonVersion,
			compare:  compareGTE,
			readReq:  func() string { v, _ := readPythonVersion(pythonVersionPath); return v },
			installCmd: func(req, platform string) []InstallStep {
				if platform == "darwin" {
					return []InstallStep{
						{Description: "Install pyenv via Homebrew", Command: "brew", Args: []string{"install", "pyenv"}},
						{Description: fmt.Sprintf("Install Python %s", req), Command: "bash", Args: []string{"-c", fmt.Sprintf("pyenv install %s && pyenv global %s", req, req)}},
					}
				}
				return []InstallStep{
					{Description: "Install pyenv", Command: "bash", Args: []string{"-c", "curl https://pyenv.run | bash"}},
					{Description: fmt.Sprintf("Install Python %s", req), Command: "bash", Args: []string{"-c", fmt.Sprintf("pyenv install %s && pyenv global %s", req, req)}},
				}
			},
		},
		// --- Rust ---
		{
			name:     "rust",
			binary:   "rustc",
			source:   "apps/a-demo-be-rust-axum/Cargo.toml → rust-version",
			args:     []string{"--version"},
			parseVer: parseRustVersion,
			compare:  compareGTE,
			readReq:  func() string { v, _ := readRustVersion(cargoTomlPath); return v },
			installCmd: func(req, platform string) []InstallStep {
				return []InstallStep{{Description: "Install Rust via rustup", Command: "bash", Args: []string{"-c", "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"}}}
			},
		},
		{
			name:     "cargo-llvm-cov",
			binary:   "cargo",
			source:   "(no config file)",
			args:     []string{"llvm-cov", "--version"},
			parseVer: parseCargoLlvmCov,
			compare:  compareExact,
			readReq:  noReq,
			installCmd: func(req, platform string) []InstallStep {
				return []InstallStep{{Description: "Install cargo-llvm-cov", Command: "bash", Args: []string{"-c", "source \"$HOME/.cargo/env\" && cargo install cargo-llvm-cov"}}}
			},
		},
		// --- Elixir/Erlang ---
		{
			name:     "elixir",
			binary:   "elixir",
			source:   ".tool-versions → elixir",
			args:     []string{"--version"},
			parseVer: parseElixirVersion,
			compare:  compareGTE,
			readReq: func() string {
				v, _ := readToolVersionsEntry(toolVersionsPath, "elixir")
				// Strip -otp-XX suffix: "1.19.5-otp-27" → "1.19.5"
				if idx := strings.Index(v, "-otp-"); idx != -1 {
					return v[:idx]
				}
				return v
			},
			installCmd: func(req, platform string) []InstallStep {
				return []InstallStep{{Description: fmt.Sprintf("Install Elixir %s via asdf", req), Command: "bash", Args: []string{"-c", fmt.Sprintf("asdf plugin add elixir 2>/dev/null; asdf install elixir %s && asdf global elixir %s", req, req)}}}
			},
		},
		{
			name:     "erlang",
			binary:   "erl",
			source:   ".tool-versions → erlang",
			args:     []string{"-noshell", "-eval", `io:format("~s",[erlang:system_info(otp_release)]),halt().`},
			parseVer: parseErlangVersion,
			compare:  compareMajorGTE,
			readReq: func() string {
				v, _ := readToolVersionsEntry(toolVersionsPath, "erlang")
				return v
			},
			installCmd: func(req, platform string) []InstallStep {
				return []InstallStep{{Description: fmt.Sprintf("Install Erlang %s via asdf", req), Command: "bash", Args: []string{"-c", fmt.Sprintf("asdf plugin add erlang 2>/dev/null; asdf install erlang %s && asdf global erlang %s", req, req)}}}
			},
		},
		// --- .NET ---
		{
			name:     "dotnet",
			binary:   "dotnet",
			source:   "apps/a-demo-be-fsharp-giraffe/global.json → sdk.version",
			args:     []string{"--version"},
			parseVer: parseDotnetVersion,
			compare:  compareMajorGTE,
			readReq:  func() string { v, _ := readDotnetVersion(globalJSONPath); return v },
			installCmd: func(req, platform string) []InstallStep {
				if platform == "darwin" {
					return []InstallStep{{Description: "Install .NET via Homebrew", Command: "brew", Args: []string{"install", "dotnet"}}}
				}
				return []InstallStep{{Description: "Install .NET via snap", Command: "sudo", Args: []string{"snap", "install", "dotnet-sdk", "--classic", "--channel=10.0"}}}
			},
		},
		// --- Clojure ---
		{
			name:      "clojure",
			binary:    "clj",
			source:    "(no config file)",
			args:      []string{"--version"},
			useStderr: false,
			parseVer:  parseClojureVersion,
			compare:   compareExact,
			readReq:   noReq,
			installCmd: func(req, platform string) []InstallStep {
				if platform == "darwin" {
					return []InstallStep{{Description: "Install Clojure via Homebrew", Command: "brew", Args: []string{"install", "clojure/tools/clojure"}}}
				}
				return []InstallStep{{Description: "Install Clojure CLI", Command: "bash", Args: []string{"-c", "curl -L -O https://github.com/clojure/brew-install/releases/latest/download/linux-install.sh && chmod +x linux-install.sh && sudo ./linux-install.sh && rm linux-install.sh"}}}
			},
		},
		// --- Dart/Flutter ---
		{
			name:       "dart",
			binary:     "dart",
			source:     "apps/a-demo-fe-dart-flutterweb/pubspec.yaml → environment.sdk",
			args:       []string{"--version"},
			parseVer:   parseDartVersion,
			compare:    compareGTE,
			readReq:    func() string { v, _ := readDartSDKVersion(pubspecPath); return v },
			installCmd: nil, // Installed as part of Flutter
		},
		{
			name:     "flutter",
			binary:   "flutter",
			source:   "apps/a-demo-fe-dart-flutterweb/pubspec.yaml → environment.flutter",
			args:     []string{"--version"},
			parseVer: parseFlutterVersion,
			compare:  compareGTE,
			readReq:  func() string { v, _ := readFlutterVersion(pubspecPath); return v },
			installCmd: func(req, platform string) []InstallStep {
				if platform == "darwin" {
					return []InstallStep{{Description: "Install Flutter via Homebrew", Command: "brew", Args: []string{"install", "--cask", "flutter"}}}
				}
				return []InstallStep{{Description: "Install Flutter via snap", Command: "sudo", Args: []string{"snap", "install", "flutter", "--classic"}}}
			},
		},
		// --- Infrastructure ---
		{
			name:     "docker",
			binary:   "docker",
			source:   "(no config file)",
			args:     []string{"--version"},
			parseVer: parseDockerVersion,
			compare:  compareExact,
			readReq:  noReq,
			installCmd: func(req, platform string) []InstallStep {
				if platform == "darwin" {
					return nil // Docker Desktop must be installed manually on macOS
				}
				return []InstallStep{{Description: "Install Docker", Command: "sudo", Args: []string{"apt-get", "install", "-y", "docker.io", "docker-compose-v2"}}}
			},
		},
		{
			name:     "jq",
			binary:   "jq",
			source:   "(no config file)",
			args:     []string{"--version"},
			parseVer: parseJqVersion,
			compare:  compareExact,
			readReq:  noReq,
			installCmd: func(req, platform string) []InstallStep {
				if platform == "darwin" {
					return []InstallStep{{Description: "Install jq via Homebrew", Command: "brew", Args: []string{"install", "jq"}}}
				}
				return []InstallStep{{Description: "Install jq", Command: "sudo", Args: []string{"apt-get", "install", "-y", "jq"}}}
			},
		},
		// --- Playwright ---
		{
			name:     "playwright",
			binary:   "npx",
			source:   "node_modules (npx playwright)",
			args:     []string{"playwright", "--version"},
			parseVer: parsePlaywrightVersion,
			compare:  comparePlaywright,
			readReq:  noReq,
			installCmd: func(req, platform string) []InstallStep {
				if platform == "darwin" {
					return []InstallStep{{Description: "Install Playwright browsers", Command: "npx", Args: []string{"playwright", "install"}}}
				}
				return []InstallStep{
					{Description: "Install Playwright browsers", Command: "npx", Args: []string{"playwright", "install"}},
					{Description: "Install Playwright system deps", Command: "npx", Args: []string{"playwright", "install-deps"}},
				}
			},
		},
	}
}
