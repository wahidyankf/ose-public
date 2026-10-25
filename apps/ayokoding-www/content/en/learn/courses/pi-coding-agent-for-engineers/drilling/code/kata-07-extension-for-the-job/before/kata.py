# Kata starter: install the checklist extension deliberately.
# => Extensions extend capability and therefore blast radius.
action = "install"  # => the registry operation
package = "pi-review-checklist"  # => frozen package name
# => TODO: read the declared needs, then record the verdict.
needs = []  # => TODO: frozen dependency list
# => Print the package so the install is attributable.
print("package:", package)  # => Output names the package
