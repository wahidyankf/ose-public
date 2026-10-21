# => Offline input-shape checker for the workflow-dispatch-inputs workflow file.
# => Checked against the vendor workflow_dispatch docs on 2026-10-20.
# => INPUTS mirrors the on.workflow_dispatch.inputs block in workflow.yaml.
# => No network and no live repository; defaults are validated as typed.
# => WHY check offline: a bad default fails the manual run form.
# => Choice options must include the default or the form lies.
# => Two inputs run the deploy: where it goes, and whether it plans.
# => Staging plus dry-run true makes the untouched form the safe form.
INPUTS = {
    # => environment: the deploy target, defaulting to safe staging.
    "environment": {
        "type": "choice",
        "default": "staging",
        "options": ["staging", "production"],
        "description": "Target to deploy.",
    },
    # => dry-run: plan first, apply only on a deliberate second run.
    "dry-run": {
        "type": "boolean",
        "default": "true",
        "description": "Plan only, change nothing.",
    },
}  # => name to shape dict, mirrors the yaml


def check_input(name, shape):  # => one verdict per declared input
    kind = shape["type"]  # => boolean, choice, number, or string
    if kind == "choice":  # => choice needs options holding the default
        # => The default must be listed or the form offers a lie.
        # => Safe defaults make the form submittable untouched.
        ok = shape["default"] in shape["options"]  # => default listed
        return ("options-hold-default", ok)  # => form honesty check
    if kind == "number":  # => number defaults must parse as numbers
        try:  # => attempt the numeric parse
            float(shape["default"])  # => any numeric literal passes
            return ("default-is-numeric", True)  # => parses fine
        except ValueError:  # => non-numeric default text
            return ("default-is-numeric", False)  # => form would reject
    if kind == "boolean":  # => boolean defaults are true or false words
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
