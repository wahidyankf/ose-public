# Example 63: Ask Pi to Build an Extension
# => Fixture shim of the Pi coding agent surface.
# => Target release 1.3.0, checked on 2026-10-20.
# => Deterministic: no network, key, or billing.
# => Real behaviour may differ; see pi.dev/docs/latest.
# => Pi bundles capabilities as installable packages.
# => Extensions, skills, and templates share one registry.
action = "scaffold"  # => install, list, or validate
# => The package name is its registry address.
package = "pi-changelog-digest"  # => frozen package under test
# => Each package declares what it needs to run.
needs = ["fetch", "write"]  # => frozen dependency list
# => Installed means every need is already satisfied.
satisfied = True  # => the frozen resolution result
print("action:", action)  # => Output names the action
print("package:", package)  # => Output names the package
print("needs:", needs)  # => Output lists the needs
print("installed:", satisfied)  # => Output gives the verdict
