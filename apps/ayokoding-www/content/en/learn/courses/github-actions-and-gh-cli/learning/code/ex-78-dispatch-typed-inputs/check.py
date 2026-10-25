# => Offline input-shape checker for the dispatch-typed-inputs workflow file.
# => Checked against the vendor workflow_dispatch docs on 2026-10-20.
# => INPUTS mirrors the on.workflow_dispatch.inputs block in workflow.yaml.
# => No network and no live repository; defaults are validated as typed.
# => WHY check offline: a bad default fails the manual run form.
# => Choice options must include the default or the form lies.
# => Three types cover the form: choice, number, and boolean.
# => Level picks the profile; users sizes it; dry-run guards it.
# => Every default below is submittable untouched and honest when touched.
# => Numbers arrive as strings; the checker parses before trusting.
INPUTS = {
    # => level: which load profile the manual run executes.
    "level": {
        "type": "choice",
        "default": "high",
        "options": ["low", "high", "soak"],
        "description": "Load profile to run.",
    },
    # => users: how many virtual users the run simulates.
    "users": {
        "type": "number",
        "default": "500",
        "description": "Virtual users to simulate.",
    },
    # => dry-run: simulate only, or send real traffic.
    "dry-run": {
        "type": "boolean",
        "default": "false",
        "description": "Simulate without traffic.",
    },
}  # => name to shape dict, mirrors the yaml


def check_input(name, shape):  # => one verdict per declared input
    kind = shape["type"]  # => boolean, choice, number, or string
    if kind == "choice":  # => choice needs options holding the default
        # => The default must be listed or the form offers a lie.
        # => Options are the contract; the default is the promise.
        ok = shape["default"] in shape["options"]  # => default listed
        return ("options-hold-default", ok)  # => form honesty check
    if kind == "number":  # => number defaults must parse as numbers
        try:  # => attempt the numeric parse
            float(shape["default"])  # => any numeric literal passes
            return ("default-is-numeric", True)  # => parses fine
        except ValueError:  # => non-numeric default text
            # => Text where a number belongs rejects the whole form.
            return ("default-is-numeric", False)  # => form would reject
    if kind == "boolean":  # => boolean defaults are true or false words
        # => Only two spellings exist; everything else misleads.
        ok = shape["default"] in ("true", "false")  # => strict vocabulary
        return ("default-is-boolean", ok)  # => spelled correctly
    return ("has-description", bool(shape.get("description")))  # => strings


def main():  # => print one verdict per input plus the rollup
    results = [(n, check_input(n, s)) for n, s in INPUTS.items()]  # => checks
    for name, (label, ok) in results:  # => one line per input
        print(("PASS" if ok else "FAIL") + ": " + name + "/" + label)  # => row
    done = sum(1 for _, (_, ok) in results if ok)  # => passing inputs
    print("inputs:", str(done) + "/" + str(len(results)))  # => summary


main()  # => run once; a FAIL means the manual form misleads
