# Kata 7: Extension for the Job
# => Pi bundles capabilities as installable packages.
# => Declared needs let you see the price before paying it.
# => Registry suits experiments; pinned sources suit fleets.
action = "install"  # => the registry operation
# => The package name is its registry address.
package = "pi-review-checklist"  # => frozen package name
# => Each package declares what it needs to run.
needs = ["read", "edit"]  # => frozen dependency list
# => Installed means every need is already satisfied.
satisfied = True  # => the frozen resolution result
# => Print action, package, needs, and the verdict.
print("action:", action)  # => Output names the action
print("package:", package)  # => Output names the package
print("needs:", needs)  # => Output lists the needs
print("installed:", satisfied)  # => Output gives the verdict
