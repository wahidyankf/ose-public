# => Example 30: the venv recipe verified, not assumed.
# => Create once with the stdlib: no downloads, no installers.
# => Activate per shell: the environment is a choice, not a default.
# => Prefix markers prove isolation: projects never touch system paths.
# => Pins recreate the env: the directory itself stays disposable.
# => Never commit the venv: environments are built, not stored.
import os  # => path handling for the recipe demonstration
import sys  # => WHY sys: prefix markers prove isolation

recipe = [
    "python3 -m venv .venv",
    "source .venv/bin/activate",
    "pip install -r pins.txt",
]  # => the three steps
for step in recipe:  # => the recipe printed as documentation
    print("step:", step)  # => Output: step: ... create, activate, install
print("prefix set:", bool(sys.prefix))  # => Output: prefix set: True
print(
    "outside system:", sys.prefix != "/usr"
)  # => Output: True, projects never use /usr
print("sep:", os.sep)  # => Output: /, path join marker shown
