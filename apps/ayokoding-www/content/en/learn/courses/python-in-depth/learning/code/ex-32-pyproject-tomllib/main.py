# => Example 32 driver: stdlib reads the metadata, no parser install.
import tomllib  # => WHY stdlib: TOML parsing ships with the interpreter

with open("sample-project.toml", "rb") as handle:  # => WHY binary: tomllib takes bytes
    project = tomllib.load(handle)["project"]  # => the portable core table
print(project["name"])  # => Output: shapes, single-sourced name
print(project["version"])  # => Output: 1.2.3, bumped in exactly one place
print(project["dependencies"])  # => Output: ['requests==2.32.3'], pinned list
print(project["requires-python"])  # => Output: >=3.10, floor declared
