---
title: "Initial Setup"
date: 2025-01-29T00:00:00+07:00
draft: false
weight: 100001
description: "Get Rust installed and running on your system - rustup installation, cargo setup, and your first working program"
tags: ["rust", "installation", "setup", "rustup", "cargo", "beginner"]
---

**Want to start programming in Rust?** This initial setup guide gets Rust installed and working on your system in minutes. By the end, you'll have Rust running and will execute your first program.

This tutorial provides 0-5% coverage - just enough to get Rust working on your machine. For deeper learning, continue to [Quick Start](/en/learn/software-engineering/programming-languages/rust/quick-start) (5-30% coverage).

## Prerequisites

Before installing Rust, you need:

- A computer running Windows, macOS, or Linux
- Administrator/sudo access for installation (Windows/Linux)
- A terminal/command prompt
- A text editor (VS Code, IntelliJ IDEA, Vim, or any editor)
- Basic command-line navigation skills
- A C compiler (macOS/Linux - we'll verify this)

No prior systems programming experience required - this guide starts from zero.

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Install** rustup (Rust toolchain installer)
2. **Verify** Rust compiler (rustc) and Cargo (build tool) installation
3. **Create** a new Rust project with Cargo
4. **Write** your first Rust program (Hello, World!)
5. **Compile** and run Rust code

## Rust Installation via rustup

rustup is the official Rust toolchain installer and version manager.

### Windows Rust Installation

**Step 1: Install Visual Studio C++ Build Tools**

Rust on Windows requires MSVC (Microsoft Visual C++) build tools.

1. Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)
2. Scroll to "All Downloads" → "Tools for Visual Studio"
3. Download "Build Tools for Visual Studio 2022"
4. Run the installer
5. Select "Desktop development with C++"
6. Click Install (this takes 10-20 minutes)

**Alternative: Install via winget**

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

**Step 2: Download and Run rustup-init.exe**

1. Visit [https://rustup.rs/](https://rustup.rs/)
2. Download `rustup-init.exe` for Windows
3. Run the downloaded file
4. You'll see a command prompt with options:

```
1) Proceed with installation (default)
2) Customize installation
3) Cancel installation
```

Press Enter (or type `1`) to proceed with default installation.

**Step 3: Wait for Installation**

rustup downloads and installs:

- Rust compiler (rustc)
- Cargo (build tool and package manager)
- Standard library
- Documentation

Installation takes 5-10 minutes depending on internet speed.

**Step 4: Verify Installation**

Open new Command Prompt or PowerShell:

```cmd
rustc --version
```

Expected output:

```
rustc 1.75.0 (82e1608df 2023-12-21)
```

Also check Cargo:

```cmd
cargo --version
```

Expected output:

```
cargo 1.75.0 (1d8b05cdd 2023-11-20)
```

**Troubleshooting Windows**:

- If `rustc` not found, restart Command Prompt to load new PATH
- Verify `%USERPROFILE%\.cargo\bin` is in PATH
- If build tools missing, reinstall Visual Studio Build Tools

### macOS Rust Installation

**Step 1: Install Command Line Tools**

Rust requires Xcode Command Line Tools (includes C compiler).

```bash
xcode-select --install
```

If already installed, you'll see: "xcode-select: error: command line tools are already installed"

**Step 2: Install Rust via rustup**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

You'll see:

```
Welcome to Rust!

This will download and install the official compiler for the Rust
programming language, and its package manager, Cargo.

...

1) Proceed with installation (default)
2) Customize installation
3) Cancel installation
>
```

Press Enter to proceed with default installation.

**Step 3: Configure PATH**

The installer adds Rust to PATH via `~/.cargo/env`. Load it:

```bash
source $HOME/.cargo/env
```

Or restart your terminal.

**Step 4: Verify Installation**

```bash
rustc --version
```

Expected output:

```
rustc 1.75.0 (82e1608df 2023-12-21)
```

Check Cargo:

```bash
cargo --version
```

Expected output:

```
cargo 1.75.0 (1d8b05cdd 2023-11-20)
```

**Troubleshooting macOS**:

- If `rustc` not found, run `source $HOME/.cargo/env`
- Add to shell config for persistence: `echo 'source $HOME/.cargo/env' >> ~/.zshrc`
- Restart terminal after installation

### Linux Rust Installation

**Step 1: Install Build Dependencies**

Rust requires a C compiler and linker.

**Ubuntu/Debian**:

```bash
sudo apt update
sudo apt install build-essential
```

**Fedora/RHEL/CentOS**:

```bash
sudo dnf install gcc
```

**Arch Linux**:

```bash
sudo pacman -S base-devel
```

**Step 2: Install Rust via rustup**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

You'll see installation options:

```
1) Proceed with installation (default)
2) Customize installation
3) Cancel installation
>
```

Press Enter for default installation.

**Step 3: Configure PATH**

Load Cargo environment:

```bash
source $HOME/.cargo/env
```

Or restart terminal.

**Step 4: Verify Installation**

```bash
rustc --version
```

Expected output:

```
rustc 1.75.0 (82e1608df 2023-12-21)
```

Check Cargo:

```bash
cargo --version
```

Expected output:

```
cargo 1.75.0 (1d8b05cdd 2023-11-20)
```

**Troubleshooting Linux**:

- If build-essential missing, install it before rustup
- Ensure PATH includes `$HOME/.cargo/bin`
- Add to shell config: `echo 'source $HOME/.cargo/env' >> ~/.bashrc`

## Understanding rustup

rustup manages Rust toolchains, allowing multiple versions.

### Check Installed Toolchains

```bash
rustup show
```

Output shows installed toolchain:

```
Default host: x86_64-unknown-linux-gnu
rustup home:  /home/<user>/.rustup

installed toolchains
--------------------

stable-x86_64-unknown-linux-gnu (default)

active toolchain
----------------

stable-x86_64-unknown-linux-gnu (default)
rustc 1.75.0 (82e1608df 2023-12-21)
```

### Update Rust

Keep Rust up-to-date:

```bash
rustup update
```

Downloads and installs latest stable version.

### Toolchain Channels

Rust has three channels:

- **stable** - Production-ready releases (6-week cycle)
- **beta** - Preview of next stable release
- **nightly** - Latest features (may be unstable)

Install a specific channel:

```bash
rustup install nightly
```

Switch default toolchain:

```bash
rustup default nightly
```

Most projects use stable channel.

## Your First Rust Program (Manual)

Let's write "Hello, World!" manually before using Cargo.

### Create Source File

Create directory and file:

```bash
mkdir -p ~/rust-projects
cd ~/rust-projects
```

Create `hello.rs`:

```rust
fn main() {
    println!("Hello, World!");
}
```

**Code breakdown**:

- `fn main()` - Entry point function (every program starts here)
- `println!` - Macro to print text with newline (note the `!`)
- `"Hello, World!"` - String to print

### Compile with rustc

Compile the source file:

```bash
rustc hello.rs
```

This creates executable:

- **Windows**: `hello.exe`
- **macOS/Linux**: `hello`

### Run the Program

**Windows**:

```cmd
hello.exe
```

**macOS/Linux**:

```bash
./hello
```

Output:

```
Hello, World!
```

**What happened**:

- rustc compiled `hello.rs` to native machine code
- No runtime or virtual machine needed
- Executable runs directly on CPU

## Create Your First Cargo Project

Cargo is Rust's build tool and package manager. Most Rust projects use Cargo.

### Create New Project

```bash
cargo new hello-rust
```

Output:

```
     Created binary (application) `hello-rust` package
```

This creates `hello-rust/` directory:

```
hello-rust/
├── Cargo.toml        # Project configuration
├── .gitignore        # Git ignore rules
└── src/
    └── main.rs       # Main source file
```

### Explore Project Structure

Navigate into project:

```bash
cd hello-rust
```

**View Cargo.toml**:

```bash
cat Cargo.toml
```

Contents:

```toml
[package]
name = "hello-rust"
version = "0.1.0"
edition = "2021"

[dependencies]
```

This file defines:

- Package metadata (name, version, Rust edition)
- Dependencies (external libraries)

**View src/main.rs**:

```bash
cat src/main.rs
```

Contents:

```rust
fn main() {
    println!("Hello, world!");
}
```

Cargo generates a Hello World program automatically.

### Build and Run with Cargo

**Build the project**:

```bash
cargo build
```

Output:

```
   Compiling hello-rust v0.1.0 (/path/to/hello-rust)
    Finished dev [unoptimized + debuginfo] target(s) in 0.50s
```

This creates `target/debug/hello-rust` (or `hello-rust.exe` on Windows).

**Run the executable**:

```bash
./target/debug/hello-rust
```

Output:

```
Hello, world!
```

**Build and run in one step**:

```bash
cargo run
```

Output:

```
    Finished dev [unoptimized + debuginfo] target(s) in 0.00s
     Running `target/debug/hello-rust`
Hello, world!
```

Cargo automatically rebuilds if source files changed.

### Build for Release

Development builds include debug information. For optimized production builds:

```bash
cargo build --release
```

Output:

```
   Compiling hello-rust v0.1.0 (/path/to/hello-rust)
    Finished release [optimized] target(s) in 0.75s
```

Creates `target/release/hello-rust` - smaller and faster than debug build.

**Size comparison**:

- Debug build: ~3-4 MB (includes debug symbols)
- Release build: ~300-400 KB (optimized, symbols stripped)

**Performance**: Release builds run significantly faster (10x+ for some code).

### Modify the Program

Edit `src/main.rs`:

```rust
fn main() {
    println!("Hello, Rust!");
    println!("Welcome to systems programming.");

    let x = 5;
    let y = 10;
    println!("{} + {} = {}", x, y, x + y);
}
```

Run again:

```bash
cargo run
```

Output:

```
   Compiling hello-rust v0.1.0 (/path/to/hello-rust)
    Finished dev [unoptimized + debuginfo] target(s) in 0.45s
     Running `target/debug/hello-rust`
Hello, Rust!
Welcome to systems programming.
5 + 10 = 15
```

**Code explanation**:

- `let x = 5;` - Declare immutable variable `x`
- `println!("{} + {} = {}", x, y, x + y)` - Format string with placeholders

## Useful Cargo Commands

### Check Code (Fast Compilation Check)

```bash
cargo check
```

Checks if code compiles without creating executable - much faster than `cargo build`.

### Format Code

```bash
cargo fmt
```

Automatically formats code according to Rust style guide.

### Run Linter (Clippy)

Install Clippy (if not already installed):

```bash
rustup component add clippy
```

Run linter:

```bash
cargo clippy
```

Clippy suggests code improvements and catches common mistakes.

### Generate Documentation

```bash
cargo doc --open
```

Generates HTML documentation for your project and opens in browser.

### Run Tests

```bash
cargo test
```

Runs all tests in your project (we'll cover testing in later tutorials).

### Clean Build Artifacts

```bash
cargo clean
```

Removes `target/` directory to free disk space.

## Development Environment Setup

Several editors provide excellent Rust support.

### VS Code with rust-analyzer

**Step 1: Install VS Code**

Download from [https://code.visualstudio.com/](https://code.visualstudio.com/)

**Step 2: Install rust-analyzer Extension**

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "rust-analyzer"
4. Click Install

**Step 3: Open Rust Project**

1. File → Open Folder → Select `hello-rust` directory
2. rust-analyzer automatically compiles project
3. Get autocomplete, inline errors, and go-to-definition

rust-analyzer provides excellent IDE features for Rust.

### IntelliJ IDEA with Rust Plugin

**Step 1: Install IntelliJ IDEA**

Download Community Edition from [https://www.jetbrains.com/idea/download/](https://www.jetbrains.com/idea/download/)

**Step 2: Install Rust Plugin**

1. Open IntelliJ IDEA
2. File → Settings → Plugins
3. Search for "Rust"
4. Install and restart IDE

**Step 3: Import Project**

1. File → Open → Select `hello-rust` directory
2. IDE detects Cargo project automatically
3. Full IDE features: refactoring, debugging, profiling

### Vim/Neovim with rust.vim

Vim users can use rust.vim plugin:

```vim
" Add to .vimrc or init.vim
Plug 'rust-lang/rust.vim'
```

Enable auto-formatting on save:

```vim
let g:rustfmt_autosave = 1
```

For advanced IDE features, use coc-rust-analyzer with CoC.

## Verify Your Setup Works

Let's confirm everything is functioning correctly.

### Test 1: Rust Compiler

```bash
rustc --version
```

Should show rustc version 1.70 or later.

### Test 2: Cargo

```bash
cargo --version
```

Should show cargo version.

### Test 3: Create and Run Project

```bash
cargo new test-project
cd test-project
cargo run
```

Should compile and print "Hello, world!"

### Test 4: Release Build

```bash
cargo build --release
./target/release/test-project
```

Should run optimized executable.

### Test 5: Code Formatting

```bash
cargo fmt
```

Should format code (no errors).

**All tests passed?** Your Rust setup is complete!

## Summary

**What you've accomplished**:

- Installed rustup (Rust toolchain installer)
- Installed Rust compiler (rustc) and Cargo build tool
- Verified installation with version checks
- Wrote and compiled your first Rust program manually
- Created and ran Rust projects with Cargo
- Built optimized release executables
- Understood Cargo project structure and workflow

**Key commands learned**:

- `rustc --version` - Check Rust compiler version
- `cargo --version` - Check Cargo version
- `rustup update` - Update Rust to latest version
- `cargo new <name>` - Create new project
- `cargo build` - Compile project
- `cargo run` - Build and run project
- `cargo build --release` - Build optimized executable
- `cargo check` - Check code without building
- `cargo fmt` - Format code

**Skills gained**:

- Rust toolchain installation and management
- rustc manual compilation understanding
- Cargo project creation and management
- Debug vs release build awareness
- Rust development workflow basics

## Next Steps

**Ready to learn Rust syntax and concepts?**

- [Quick Start](/en/learn/software-engineering/programming-languages/rust/quick-start) (5-30% coverage) - Touch all core Rust concepts in a fast-paced tour

**Want comprehensive fundamentals?**

**Prefer code-first learning?**

- [By-Example Tutorial](/en/learn/software-engineering/programming-languages/rust/by-example) - Learn through heavily annotated examples

**Want to understand Rust's design philosophy?**

- [Overview](/en/learn/software-engineering/programming-languages/rust/overview) - Why Rust exists and when to use it

## Troubleshooting Common Issues

### "rustc: command not found" (Linux/macOS)

**Problem**: Rust not in PATH.

**Solution**:

- Run `source $HOME/.cargo/env` in current terminal
- Add to shell config: `echo 'source $HOME/.cargo/env' >> ~/.bashrc`
- Restart terminal

### "rustc: command not found" (Windows)

**Problem**: Rust not in PATH.

**Solution**:

- Restart Command Prompt or PowerShell
- Verify `%USERPROFILE%\.cargo\bin` in PATH
- Reboot computer if PATH changes don't take effect

### "linker `cc` not found" (Linux)

**Problem**: C compiler not installed.

**Solution**:

- Install build-essential: `sudo apt install build-essential` (Ubuntu/Debian)
- Or install gcc: `sudo dnf install gcc` (Fedora)
- Recompile after installing compiler

### "linker `link.exe` not found" (Windows)

**Problem**: Visual Studio C++ Build Tools not installed.

**Solution**:

- Install Visual Studio Build Tools with "Desktop development with C++"
- Reinstall rustup after installing build tools
- Restart computer

### Cargo build is slow

**Problem**: First build downloads dependencies and compiles everything.

**Solution**:

- First build takes time (normal behavior)
- Subsequent builds much faster (incremental compilation)
- Use `cargo check` for faster compilation checking
- Release builds take longer due to optimizations

### "Permission denied" running executable (Linux/macOS)

**Problem**: Executable doesn't have execute permission.

**Solution**:

- Cargo-built executables have correct permissions automatically
- For rustc-built executables: `chmod +x ./hello`

### Outdated Rust version

**Problem**: Old Rust version installed.

**Solution**:

- Update via rustup: `rustup update`
- Check version after update: `rustc --version`
- rustup updates all components (rustc, cargo, std)

## Further Resources

**Official Documentation**:

- [The Rust Programming Language Book](https://doc.rust-lang.org/book/) - Official comprehensive tutorial
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) - Learn through examples
- [Rustlings](https://github.com/rust-lang/rustlings/) - Small exercises to get started
- [Rust Standard Library Docs](https://doc.rust-lang.org/std/) - Complete API reference

**Interactive Learning**:

- [Rustlings](https://github.com/rust-lang/rustlings/) - Interactive exercises
- [Exercism Rust Track](https://exercism.org/tracks/rust) - Practice problems with mentorship
- [Rust Playground](https://play.rust-lang.org/) - Try Rust in browser without installation

**Books**:

- [The Rust Programming Language](https://doc.rust-lang.org/book/) (Free online)
- [Programming Rust](https://www.oreilly.com/library/view/programming-rust-2nd/9781492052586/) - O'Reilly, comprehensive
- [Rust in Action](https://www.manning.com/books/rust-in-action) - Manning, practical approach

**Community**:

- [Rust Users Forum](https://users.rust-lang.org/) - Community help and discussion
- [/r/rust](https://www.reddit.com/r/rust/) - Reddit Rust community
- [Rust Discord](https://discord.gg/rust-lang) - Real-time chat
- [This Week in Rust](https://this-week-in-rust.org/) - Weekly newsletter
