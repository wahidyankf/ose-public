---
title: "Initial Setup"
date: 2025-01-29T00:00:00+07:00
draft: false
weight: 100001
description: "Get Go installed and running on your system - installation, verification, and your first working program"
tags: ["golang", "installation", "setup", "beginner"]
---

**Want to start programming in Go?** This initial setup guide gets Go installed and working on your system in minutes. By the end, you'll have Go running and will execute your first program.

This tutorial provides 0-5% coverage - just enough to get Go working on your machine. For deeper learning, continue to [Quick Start](/en/learn/software-engineering/programming-languages/golang/quick-start) (5-30% coverage).

## Prerequisites

Before installing Go, you need:

- A computer running Windows, macOS, or Linux
- Administrator/sudo access for installation
- A terminal/command prompt
- A text editor (VS Code, Vim, Notepad++, or any editor)
- Basic command-line navigation skills

No prior programming experience required - this guide starts from zero.

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Install** the Go compiler and toolchain on your operating system
2. **Verify** that Go is installed correctly and check the version
3. **Write** your first Go program (Hello, World!)
4. **Execute** Go programs using `go run` and `go build`
5. **Navigate** the Go workspace and understand GOPATH basics

## Platform-Specific Installation

Choose your operating system and follow the installation steps.

### Windows Installation

**Step 1: Download the Installer**

1. Visit the official Go download page: [https://go.dev/dl/](https://go.dev/dl/)
2. Click on the Windows installer (`.msi` file) for your architecture:
   - **64-bit**: `go1.22.X.windows-amd64.msi` (most common)
   - **32-bit**: `go1.22.X.windows-386.msi` (older systems)

**Step 2: Run the Installer**

1. Double-click the downloaded `.msi` file
2. Follow the installation wizard:
   - Click **Next** on the welcome screen
   - Accept the license agreement
   - Keep the default installation directory (`C:\Program Files\Go`)
   - Click **Install** and wait for completion
   - Click **Finish**

**Step 3: Verify Installation**

Open Command Prompt or PowerShell and run:

```cmd
go version
```

Expected output:

```
go version go1.22.X windows/amd64
```

**Step 4: Check Environment Variables**

The installer automatically sets up:

- `GOROOT`: Points to Go installation (`C:\Program Files\Go`)
- `PATH`: Includes `C:\Program Files\Go\bin` for `go` command access

Verify with:

```cmd
echo %GOROOT%
echo %PATH%
```

**Troubleshooting Windows**:

- If `go version` fails, restart your terminal or computer to load environment variables
- Check PATH contains `C:\Program Files\Go\bin`
- Ensure you have administrator rights during installation

### macOS Installation

**Step 1: Download the Package**

1. Visit [https://go.dev/dl/](https://go.dev/dl/)
2. Download the macOS package (`.pkg` file):
   - **Apple Silicon (M1/M2/M3)**: `go1.22.X.darwin-arm64.pkg`
   - **Intel Macs**: `go1.22.X.darwin-amd64.pkg`

Not sure which? Run `uname -m` in Terminal:

- `arm64` → Apple Silicon
- `x86_64` → Intel

**Step 2: Install via Package**

1. Double-click the downloaded `.pkg` file
2. Follow the installer:
   - Click **Continue** through the introduction
   - Accept the license agreement
   - Keep default install location (`/usr/local/go`)
   - Click **Install** (may require password)
   - Click **Close** when complete

**Step 3: Verify Installation**

Open Terminal and run:

```bash
go version
```

Expected output:

```
go version go1.22.X darwin/arm64
```

(or `darwin/amd64` for Intel Macs)

**Step 4: Check Environment**

The installer adds Go to your PATH automatically. Verify:

```bash
which go

echo $GOROOT
```

**Alternative: Install via Homebrew**

If you use Homebrew, install with:

```bash
brew install go
```

Verify:

```bash
go version
```

**Troubleshooting macOS**:

- If `go version` fails, restart Terminal to load environment variables
- Check `/usr/local/go/bin` is in your PATH: `echo $PATH | grep go`
- For shell config issues, add to `~/.zshrc` or `~/.bash_profile`:

  ```bash
  export PATH=$PATH:/usr/local/go/bin
  ```

### Linux Installation

**Step 1: Download the Archive**

Visit [https://go.dev/dl/](https://go.dev/dl/) and download the Linux archive:

- **64-bit**: `go1.22.X.linux-amd64.tar.gz`
- **ARM64**: `go1.22.X.linux-arm64.tar.gz` (for ARM systems like Raspberry Pi)

Or download directly via terminal:

```bash
wget https://go.dev/dl/go1.22.X.linux-amd64.tar.gz
```

(Replace `X` with the latest minor version)

**Step 2: Extract and Install**

Remove any previous Go installation and extract the archive to `/usr/local`:

```bash
sudo rm -rf /usr/local/go

sudo tar -C /usr/local -xzf go1.22.X.linux-amd64.tar.gz
```

**Step 3: Add Go to PATH**

Add Go's binary directory to your PATH. Edit your shell configuration file:

For Bash (`~/.bashrc` or `~/.bash_profile`):

```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

For Zsh (`~/.zshrc`):

```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.zshrc
source ~/.zshrc
```

**Step 4: Verify Installation**

```bash
go version
```

Expected output:

```
go version go1.22.X linux/amd64
```

**Step 5: Check Environment**

```bash
which go

echo $GOROOT
```

**Alternative: Install via Package Manager**

Some Linux distributions include Go in their repositories:

**Ubuntu/Debian** (may not be latest version):

```bash
sudo apt update
sudo apt install golang-go
```

**Fedora/RHEL/CentOS**:

```bash
sudo dnf install golang
```

**Arch Linux**:

```bash
sudo pacman -S go
```

For the latest version, always prefer manual installation from [go.dev](https://go.dev/dl/).

**Troubleshooting Linux**:

- If `go version` fails, ensure PATH is set correctly: `echo $PATH | grep go`
- Restart terminal after editing `.bashrc` or `.zshrc`
- Verify Go binary exists: `ls /usr/local/go/bin/go`

## Version Verification

After installation, verify Go is working correctly.

### Check Go Version

```bash
go version
```

You should see output like:

```
go version go1.22.X <os>/<arch>
```

Where:

- `go1.22.X`: Go version (1.22 is the major.minor version, X is patch)
- `<os>`: Operating system (windows, darwin, linux)
- `<arch>`: Architecture (amd64, arm64, 386)

### Check Go Environment

Go stores environment configuration. View it with:

```bash
go env
```

This displays all Go environment variables. Key ones:

- **GOROOT**: Go installation directory (e.g., `/usr/local/go`)
- **GOPATH**: Workspace directory (defaults to `~/go`)
- **GOBIN**: Where `go install` puts binaries
- **GOOS**: Target operating system
- **GOARCH**: Target architecture

### Inspect Specific Variables

```bash
go env GOROOT

go env GOPATH

go env GOROOT GOPATH GOBIN
```

## Your First Go Program

Let's write and run your first Go program - the classic "Hello, World!".

### Create a Project Directory

Create a directory for your Go projects:

```bash
mkdir -p ~/go-projects/hello
cd ~/go-projects/hello
```

**Directory structure**:

```
~/go-projects/
└── hello/
    └── (we'll create files here)
```

### Initialize a Go Module

Go uses modules to manage dependencies. Initialize a module:

```bash
go mod init hello
```

This creates `go.mod` file:

```go
module hello

go 1.22
```

**What this does**:

- Creates `go.mod` tracking module name and Go version
- Module name: `hello` (can be any name for local projects)
- Go version: Specifies minimum Go version required

### Write the Program

Create a file named `main.go`:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

**Code breakdown**:

- `package main`: Declares this is an executable program (not a library)
- `import "fmt"`: Imports the format package for printing
- `func main()`: Entry point - Go starts execution here
- `fmt.Println(...)`: Prints text to console with newline

**Save the file** as `main.go` in your project directory.

### Run the Program

Execute your program with `go run`:

```bash
go run main.go
```

**Output**:

```
Hello, World!
```

**What happened**:

- Go compiled `main.go` to a temporary executable
- Ran the executable
- Printed output
- Cleaned up temporary file

### Build an Executable

Instead of running directly, you can build a standalone executable:

```bash
go build
```

This creates an executable file:

- **Windows**: `hello.exe`
- **macOS/Linux**: `hello`

Run the executable:

```bash
hello.exe

./hello
```

**Output**:

```
Hello, World!
```

**Difference between `go run` and `go build`**:

- **`go run`**: Compiles and runs immediately (good for development)
- **`go build`**: Creates reusable executable (good for distribution)

### Project Structure Summary

Your project now looks like:

```
~/go-projects/hello/
├── go.mod          # Module definition
├── main.go         # Source code
└── hello           # Executable (after go build)
```

## Understanding Go Workspace

Go organizes code in a workspace structure.

### GOPATH Workspace

By default, Go uses `~/go` (or `%USERPROFILE%\go` on Windows) as the workspace:

```
~/go/
├── bin/        # Installed binaries (from go install)
├── pkg/        # Compiled package objects (cache)
└── src/        # Source code (legacy, not needed with modules)
```

**Modern Go (Go 1.11+)**: Modules replaced GOPATH-based development. You can place projects anywhere, but Go still uses `~/go` for installed tools.

### Where to Put Projects

With modules, create projects anywhere:

```bash
~/projects/myapp
~/dev/go/myapp
/home/<user>/code/myapp
C:\Users\username\projects\myapp
```

No need to place projects inside `~/go/src` anymore.

### Installing Go Tools

Go tools install to `~/go/bin` (or `$GOPATH/bin`).

Example - install a tool:

```bash
go install golang.org/x/tools/cmd/goimports@latest
```

The binary installs to:

- **Linux/macOS**: `~/go/bin/goimports`
- **Windows**: `%USERPROFILE%\go\bin\goimports.exe`

**Add `~/go/bin` to PATH** to run installed tools from anywhere:

**Linux/macOS** (add to `~/.bashrc` or `~/.zshrc`):

```bash
export PATH=$PATH:~/go/bin
```

**Windows** (Command Prompt):

```cmd
setx PATH "%PATH%;%USERPROFILE%\go\bin"
```

## Verify Your Setup Works

Let's confirm everything is working correctly.

### Test 1: Version Check

```bash
go version
```

Should output Go version and architecture.

### Test 2: Run Hello World

```bash
cd ~/go-projects/hello
go run main.go
```

Should print:

```
Hello, World!
```

### Test 3: Build Executable

```bash
go build
./hello  # or hello.exe on Windows
```

Should print:

```
Hello, World!
```

### Test 4: Check Environment

```bash
go env GOROOT GOPATH
```

Should output paths to Go installation and workspace.

**All tests passed?** Your Go setup is complete!

## Summary

**What you've accomplished**:

- Installed Go compiler and toolchain on your operating system
- Verified Go installation with version and environment checks
- Created and initialized your first Go module
- Wrote and executed a Hello World program
- Built a standalone executable from Go source code
- Understood Go workspace structure (GOPATH and modules)

**Key commands learned**:

- `go version` - Check Go version
- `go env` - View environment variables
- `go mod init` - Initialize a new module
- `go run` - Compile and run code immediately
- `go build` - Build executable binary
- `go install` - Install Go tools

**Skills gained**:

- Platform-specific Go installation
- Module-based project setup
- Running and building Go programs
- Navigating Go workspace and environment

## Next Steps

**Ready to learn Go syntax and concepts?**

- [Quick Start](/en/learn/software-engineering/programming-languages/golang/quick-start) (5-30% coverage) - Touch all core Go concepts in a fast-paced tour

**Want comprehensive fundamentals?**

**Prefer code-first learning?**

- [By-Example Tutorial](/en/learn/software-engineering/programming-languages/golang/by-example) - Learn through 75+ heavily annotated examples

**Want to understand Go's design philosophy?**

- [Overview](/en/learn/software-engineering/programming-languages/golang/overview) - Why Go exists and when to use it

## Troubleshooting Common Issues

### "go: command not found"

**Problem**: Terminal doesn't recognize `go` command.

**Solution**:

- Verify Go is installed: Check installation directory exists
- Add Go to PATH:
  - **Linux/macOS**: Add `export PATH=$PATH:/usr/local/go/bin` to `~/.bashrc` or `~/.zshrc`
  - **Windows**: Ensure `C:\Program Files\Go\bin` is in PATH environment variable
- Restart terminal after PATH changes

### "Permission denied" (Linux/macOS)

**Problem**: Can't execute Go binary or install to `/usr/local`.

**Solution**:

- Use `sudo` for installation: `sudo tar -C /usr/local -xzf go1.22.X.linux-amd64.tar.gz`
- For running programs, no `sudo` needed - check file permissions: `chmod +x ./hello`

### "Windows cannot find go.exe"

**Problem**: Windows can't find Go after installation.

**Solution**:

- Restart Command Prompt/PowerShell to load new PATH
- Reboot computer if PATH changes don't take effect
- Manually check PATH: `echo %PATH%` should include `C:\Program Files\Go\bin`

### Old Go version detected

**Problem**: `go version` shows older version after installing newer one.

**Solution**:

- **Linux/macOS**: Remove old installation first: `sudo rm -rf /usr/local/go`
- **Windows**: Uninstall via Control Panel before installing new version
- Check multiple Go installations: `which -a go` (Linux/macOS) or `where go` (Windows)

### "go.mod not found"

**Problem**: Go commands fail with module error.

**Solution**:

- Initialize module: `go mod init <module-name>`
- Ensure you're in project directory: `cd ~/go-projects/hello`
- For simple scripts, you can skip modules (but it's not recommended)

## Further Resources

**Official Go Documentation**:

- [Go.dev](https://go.dev/) - Official Go website
- [Go Installation Guide](https://go.dev/doc/install) - Official installation instructions
- [Getting Started Tutorial](https://go.dev/doc/tutorial/getting-started) - Official first tutorial
- [Go Tour](https://go.dev/tour/) - Interactive online tutorial

**Development Tools**:

- [VS Code](https://code.visualstudio.com/) with [Go extension](https://marketplace.visualstudio.com/items?itemName=golang.go) - Popular editor
- [GoLand](https://www.jetbrains.com/go/) - JetBrains IDE for Go
- [Vim with vim-go](https://github.com/fatih/vim-go) - Vim plugin for Go development

**Community**:

- [Go Forum](https://forum.golangbridge.org/) - Community help
- [/r/golang](https://www.reddit.com/r/golang/) - Reddit community
- [Gopher Slack](https://gophers.slack.com/) - Real-time chat (get invite at [invite.slack.golangbridge.org](https://invite.slack.golangbridge.org/))
