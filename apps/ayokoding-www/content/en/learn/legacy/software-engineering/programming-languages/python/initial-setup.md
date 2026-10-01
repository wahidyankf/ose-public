---
title: "Initial Setup"
date: 2025-01-29T00:00:00+07:00
draft: false
weight: 100001
description: "Get Python installed and running on your system - installation, verification, and your first working program"
tags: ["python", "installation", "setup", "beginner"]
---

**Want to start programming in Python?** This initial setup guide gets Python installed and working on your system in minutes. By the end, you'll have Python running and will execute your first program.

This tutorial provides 0-5% coverage - just enough to get Python working on your machine. For deeper learning, continue to [Quick Start](/en/learn/software-engineering/programming-languages/python/quick-start) (5-30% coverage).

## Prerequisites

Before installing Python, you need:

- A computer running Windows, macOS, or Linux
- Administrator/sudo access for installation
- A terminal/command prompt
- A text editor (VS Code, Vim, Notepad++, or any editor)
- Basic command-line navigation skills

No prior programming experience required - this guide starts from zero.

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Install** the Python interpreter on your operating system
2. **Verify** that Python is installed correctly and check the version
3. **Write** your first Python program (Hello, World!)
4. **Execute** Python programs using the interpreter
5. **Manage** Python packages with pip

## Platform-Specific Installation

Choose your operating system and follow the installation steps.

### Windows Installation

**Step 1: Download the Installer**

1. Visit the official Python download page: [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Click **Download Python 3.12.X** (or latest version)
3. Save the installer (e.g., `python-3.12.X-amd64.exe`)

**Step 2: Run the Installer**

1. Double-click the downloaded `.exe` file
2. **CRITICAL**: Check **"Add python.exe to PATH"** at the bottom (this is essential!)
3. Click **Install Now** (recommended) or **Customize Installation** for advanced options
4. Wait for installation to complete
5. Click **Close**

**Step 3: Verify Installation**

Open Command Prompt or PowerShell and run:

```cmd
python --version
```

Expected output:

```
Python 3.12.X
```

Also check pip (Python package manager):

```cmd
pip --version
```

Expected output:

```
pip 24.X.X from C:\Users\...\Python312\lib\site-packages\pip (python 3.12)
```

**Troubleshooting Windows**:

- If `python --version` fails, you forgot to check "Add python.exe to PATH" during installation. Reinstall Python and check that box!
- If `python` opens Microsoft Store instead, use `python3` or `py` command
- Restart Command Prompt after installation to load PATH changes

### macOS Installation

**Step 1: Check if Python is Pre-installed**

macOS includes Python 2.7 (deprecated) and sometimes Python 3. Check:

```bash
python3 --version
```

If it shows Python 3.8+, you already have Python! But for the latest version, continue below.

**Step 2: Download the Package**

1. Visit [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Click **Download Python 3.12.X** (macOS installer)
3. Download the `.pkg` file:
   - **Universal2**: Works on both Intel and Apple Silicon Macs (recommended)

**Step 3: Install via Package**

1. Double-click the downloaded `.pkg` file
2. Follow the installer:
   - Click **Continue** through the introduction
   - Accept the license agreement
   - Keep default install location
   - Click **Install** (may require password)
   - Click **Close** when complete

**Step 4: Verify Installation**

Open Terminal and run:

```bash
python3 --version
```

Expected output:

```
Python 3.12.X
```

Check pip:

```bash
pip3 --version
```

Expected output:

```
pip 24.X.X from /Library/Frameworks/Python.framework/Versions/3.12/lib/python3.12/site-packages/pip (python 3.12)
```

**Alternative: Install via Homebrew**

If you use Homebrew, install with:

```bash
brew install python
```

Verify:

```bash
python3 --version
pip3 --version
```

**Troubleshooting macOS**:

- Always use `python3` (not `python`) to avoid running system Python 2.7
- If `python3 --version` shows old version, Homebrew installation takes precedence over system Python
- Add Homebrew Python to PATH if needed: `export PATH="/usr/local/opt/python/libexec/bin:$PATH"` in `~/.zshrc`

### Linux Installation

Python usually comes pre-installed on Linux, but it may be an older version.

**Step 1: Check Current Version**

```bash
python3 --version
```

If it shows Python 3.10+, you're good! If not, follow the installation steps below.

**Step 2: Install via Package Manager**

**Ubuntu/Debian**:

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

**Fedora/RHEL/CentOS**:

```bash
sudo dnf install python3 python3-pip
```

**Arch Linux**:

```bash
sudo pacman -S python python-pip
```

**Step 3: Verify Installation**

```bash
python3 --version
pip3 --version
```

Expected output:

```
Python 3.12.X
pip 24.X.X from /usr/lib/python3/dist-packages/pip (python 3.12)
```

**Alternative: Install from Source (Latest Version)**

For the absolute latest Python version:

```bash
sudo apt install build-essential zlib1g-dev libncurses5-dev libgdbm-dev \
  libnss3-dev libssl-dev libreadline-dev libffi-dev libsqlite3-dev wget libbz2-dev

wget https://www.python.org/ftp/python/3.12.X/Python-3.12.X.tgz
tar -xf Python-3.12.X.tgz
cd Python-3.12.X

./configure --enable-optimizations
make -j $(nproc)
sudo make altinstall  # altinstall avoids overwriting system python3
```

Verify:

```bash
python3.12 --version
```

**Troubleshooting Linux**:

- If `python3` points to old version, use `python3.12` explicitly or update alternatives:

  ```bash
  sudo update-alternatives --install /usr/bin/python3 python3 /usr/local/bin/python3.12 1
  ```

- Ensure pip is installed: `sudo apt install python3-pip` (Ubuntu/Debian)
- Use `python3` and `pip3` commands (not `python` and `pip`)

## Version Verification

After installation, verify Python is working correctly.

### Check Python Version

```bash
python --version

python3 --version
```

You should see:

```
Python 3.12.X
```

(Where X is the minor version number)

### Check pip Version

pip is Python's package manager (installs libraries).

```bash
pip --version

pip3 --version
```

Expected output:

```
pip 24.X.X from <path>/site-packages/pip (python 3.12)
```

### Check Installation Path

Find where Python is installed:

```bash
where python

which python3
```

This shows the path to the Python executable.

## Your First Python Program

Let's write and run your first Python program - the classic "Hello, World!".

### Create a Project Directory

Create a directory for your Python projects:

```bash
mkdir -p ~/python-projects/hello
cd ~/python-projects/hello
```

**Directory structure**:

```
~/python-projects/
└── hello/
    └── (we'll create files here)
```

### Write the Program

Create a file named `hello.py`:

```python
print("Hello, World!")
```

That's it! Python is concise - one line prints text.

**Code breakdown**:

- `print()`: Built-in function that outputs text to console
- `"Hello, World!"`: String (text) to print

**Save the file** as `hello.py` in your project directory.

### Run the Program

Execute your program:

```bash
python hello.py

python3 hello.py
```

**Output**:

```
Hello, World!
```

**What happened**:

- Python interpreter read `hello.py`
- Executed the `print()` statement
- Output appeared in terminal

### Interactive Mode (REPL)

Python has an interactive mode (REPL - Read-Eval-Print Loop) for testing code:

```bash
python

python3
```

You'll see the Python prompt:

```
Python 3.12.X (main, ...)
[GCC ...] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

Try some commands:

```python
>>> print("Hello, World!")
Hello, World!
>>> 2 + 2
4
>>> name = "Python"
>>> f"I'm learning {name}!"
"I'm learning Python!"
>>> exit()
```

**Exit interactive mode**: Type `exit()` or press `Ctrl+D` (Linux/macOS) or `Ctrl+Z` then Enter (Windows).

### More Detailed Example

Let's write a slightly more complex program. Create `greet.py`:

```python
name = input("What's your name? ")

print(f"Hello, {name}! Welcome to Python.")

age = int(input("What's your age? "))
print(f"In 10 years, you'll be {age + 10} years old!")
```

Run it:

```bash
python greet.py

python3 greet.py
```

**Interaction**:

```
What's your name? Alice
Hello, Alice! Welcome to Python.
What's your age? 25
In 10 years, you'll be 35 years old!
```

**Code breakdown**:

- `input()`: Gets user input (returns string)
- `f"..."`: f-string (formatted string) - embeds variables inside `{}`
- `int()`: Converts string to integer for math

## Managing Python Packages with pip

pip is Python's package manager - installs third-party libraries.

### Check pip Installation

```bash
pip --version

pip3 --version
```

### Install a Package

Let's install `requests` (popular HTTP library):

```bash
pip install requests

pip3 install requests
```

Output shows download and installation progress:

```
Collecting requests
  Downloading requests-2.31.0-py3-none-any.whl (62 kB)
Installing collected packages: requests
Successfully installed requests-2.31.0
```

### List Installed Packages

```bash
pip list

pip3 list
```

Shows all installed packages:

```
Package    Version
---------- -------
pip        24.X.X
requests   2.31.0
setuptools 69.X.X
```

### Use an Installed Package

Create `test_requests.py`:

```python
import requests

response = requests.get("https://httpbin.org/get")

print(f"Status code: {response.status_code}")

print(response.json())
```

Run it:

```bash
python test_requests.py

python3 test_requests.py
```

Output shows HTTP response data.

### Uninstall a Package

```bash
pip uninstall requests

pip3 uninstall requests
```

Confirm with `y` when prompted.

## Virtual Environments (Best Practice)

Virtual environments isolate project dependencies - prevents conflicts between projects.

### Create a Virtual Environment

```bash
python -m venv myenv

python3 -m venv myenv
```

This creates `myenv/` directory containing isolated Python environment.

### Activate the Virtual Environment

**Windows (Command Prompt)**:

```cmd
myenv\Scripts\activate
```

**Windows (PowerShell)**:

```powershell
myenv\Scripts\Activate.ps1
```

(If you get an error about execution policy, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`)

**macOS/Linux**:

```bash
source myenv/bin/activate
```

**Activated prompt**:

```
(myenv) C:\Users\<name>\python-projects\hello>
```

(Notice `(myenv)` prefix - indicates virtual environment is active)

### Install Packages in Virtual Environment

With virtual environment activated:

```bash
pip install requests
```

Packages install to `myenv/` directory (not system-wide).

### Deactivate Virtual Environment

```bash
deactivate
```

Prompt returns to normal (no `(myenv)` prefix).

### Why Use Virtual Environments?

**Problem without venvs**: Project A needs `requests==2.28.0`, Project B needs `requests==2.31.0`. Can't have both system-wide!

**Solution with venvs**: Each project has its own isolated environment with specific package versions.

## Summary

**What you've accomplished**:

- Installed Python interpreter on your operating system
- Verified Python installation with version checks
- Wrote and executed your first Python programs
- Used Python's interactive REPL mode for experimentation
- Managed packages with pip (install, list, uninstall)
- Created virtual environments for isolated project dependencies

**Key commands learned**:

- `python --version` / `python3 --version` - Check Python version
- `python hello.py` / `python3 hello.py` - Run Python script
- `python` / `python3` - Enter interactive REPL mode
- `pip install <package>` - Install a package
- `pip list` - List installed packages
- `python -m venv <name>` - Create virtual environment
- `activate` / `source <name>/bin/activate` - Activate virtual environment

**Skills gained**:

- Platform-specific Python installation
- Running Python scripts and interactive mode
- Package management with pip
- Virtual environment creation and management

## Next Steps

**Ready to learn Python syntax and concepts?**

- [Quick Start](/en/learn/software-engineering/programming-languages/python/quick-start) (5-30% coverage) - Touch all core Python concepts in a fast-paced tour

**Want comprehensive fundamentals?**

**Prefer code-first learning?**

- [By-Example Tutorial](/en/learn/software-engineering/programming-languages/python/by-example) - Learn through heavily annotated examples

**Want to understand Python's design philosophy?**

- [Overview](/en/learn/software-engineering/programming-languages/python/overview) - Why Python exists and when to use it

## Troubleshooting Common Issues

### "python: command not found" (Windows)

**Problem**: Windows can't find Python command.

**Solution**:

- During installation, check **"Add python.exe to PATH"** box
- Reinstall Python if you missed this step
- Or manually add to PATH: `C:\Users\<username>\AppData\Local\Programs\Python\Python312`

### "python3: command not found" (macOS/Linux)

**Problem**: System doesn't recognize `python3` command.

**Solution**:

- Install Python: Follow platform-specific installation steps above
- Ensure installation completed successfully
- Try `python` instead of `python3` (some systems link them)

### "No module named pip"

**Problem**: pip is not installed.

**Solution**:

- **Windows**: pip installs automatically with Python
- **macOS/Linux**: Install with `sudo apt install python3-pip` (Ubuntu/Debian) or package manager
- Verify: `pip3 --version` or `python3 -m pip --version`

### Virtual environment activation fails (Windows PowerShell)

**Problem**: PowerShell blocks script execution.

**Solution**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activation again: `myenv\Scripts\Activate.ps1`

### Package installation fails with "Permission denied"

**Problem**: No write access to system Python directory.

**Solution**:

- Use virtual environment (recommended): Create venv and install packages there
- Or install with `--user` flag: `pip install --user <package>`
- Avoid using `sudo pip` (can break system Python)

### Multiple Python versions installed

**Problem**: `python --version` shows old version.

**Solution**:

- Use version-specific command: `python3.12 --version`
- Update PATH to prioritize new Python
- Or use `py` launcher (Windows): `py -3.12 --version`

## Further Resources

**Official Python Documentation**:

- [Python.org](https://www.python.org/) - Official Python website
- [Python Beginner's Guide](https://wiki.python.org/moin/BeginnersGuide) - Official getting started guide
- [Python Tutorial](https://docs.python.org/3/tutorial/) - Official comprehensive tutorial
- [Python Package Index (PyPI)](https://pypi.org/) - Repository of Python packages

**Development Tools**:

- [VS Code](https://code.visualstudio.com/) with [Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python) - Popular editor
- [PyCharm](https://www.jetbrains.com/pycharm/) - JetBrains IDE for Python
- [Jupyter Notebook](https://jupyter.org/) - Interactive notebook for data science

**Community**:

- [Python Forum](https://python-forum.io/) - Community help
- [/r/learnpython](https://www.reddit.com/r/learnpython/) - Reddit beginner community
- [Python Discord](https://pythondiscord.com/) - Real-time chat for learners
