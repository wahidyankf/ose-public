// Example 33: Cargo.lock Pins Versions.
//
// A lockfile answers "which exact bytes built this binary": each package
// gets one version, so two machines compile the same graph. The checker
// below reads the mounted lockfile and enforces the two rules that make a
// lock trustworthy: each package pins exactly one version, and every
// version string has three dot-separated numbers.
// => the manifest wishes, the lockfile records: wishes float, records pin
// => the fixture is abbreviated: real lockfiles add one checksum line each

// check_lock verifies the two lock rules over the mounted lock text.
// => packages split on blank lines: each block names one pinned crate
// => refusals quote the offending block: the author finds it in one jump
fn check_lock(text: &str) -> Result<Vec<(String, String)>, String> {
    // => pairs out: name and version travel together, in file order
    // => pinned pairs accumulate in file order: the transcript sorts later
    let mut pinned: Vec<(String, String)> = Vec::new();
    // => tuple order is fixed: name first, version second, everywhere
    // => split on empty lines: one block per [[package]] stanza below
    for block in text.split("\n\n") {
        // => double newline splits: one stanza per package block
        // => skip the empty tail the final newline leaves behind
        if block.trim().is_empty() {
            continue;
        }
        // => each block contributes at most one name and one version
        let mut name: Option<&str> = None;
        // => None until seen: a missing name stays missing, honestly
        let mut version: Option<&str> = None;
        // => None until seen: a missing version stays missing too
        for line in block.lines() {
            // => inner loop per stanza: each line offers name or version
            // => trim quotes: values arrive as name = "itoa" quoted
            if let Some(value) = line.strip_prefix("name = ") {
                // => strip_prefix tests shape: only name rows bind here
                name = Some(value.trim().trim_matches('"'));
                // => quotes trimmed: the lock quotes, the pair stores bare
            }
            if let Some(value) = line.strip_prefix("version = ") {
                // => version rows bind here: name rows cannot match this prefix
                version = Some(value.trim().trim_matches('"'));
                // => same trim: both fields store unquoted, uniformly
            }
        }
        // => rule one: a package block without a name pins nothing at all
        let name = name.ok_or_else(|| format!("lock block pins no name: {block:?}"))?;
        // => shadowing narrows Option to &str: proven present, then borrowed
        // => rule two: the version needs its three numbers, or it floats
        let version = version.ok_or_else(|| format!("package {name} pins no version"))?;
        // => same narrowing: the name above makes the message specific
        if version.split('.').count() != 3 {
            // => inverted from Example 32: refuse the shape that is not x.y.z
            return Err(format!("package {name} version {version:?} is not x.y.z"));
            // => both names quoted: the author finds the offender in one jump
        }
        pinned.push((name.to_string(), version.to_string()));
        // => owned copies push: the pairs outlive the borrowed text
    }
    // => an empty lock pins nothing: the refusal says so directly
    if pinned.is_empty() {
        // => emptiness is a verdict: a lock with no packages pins nothing
        return Err("lockfile pins no packages".to_string());
        // => static message, owned exit: no evidence to quote here
    }
    // => insertion order kept: main sorts a copy for printing
    Ok(pinned)
}

fn main() {
    // => read then check: the mount provides, the function verifies
    // => the harness mounts the unit folder at /data: the lock waits there
    let text = std::fs::read_to_string("/data/Cargo.lock")
        // => absolute guest path: the harness mounts the unit folder there
        .map_err(|error| format!("cannot read mounted lockfile: {error}"));
    // => map_err wraps IO failure: the message names the missing mount
    // => one match on the read: pinned pairs print, or the rule explains
    match text {
        Ok(text) => match check_lock(&text) {
            // => name and version per line: the exact graph that built this
            Ok(pinned) => {
                let mut ordered = pinned;
                // => move, not clone: the original has served its purpose
                ordered.sort();
                // => tuples sort by name first: version breaks ties silently
                for (name, version) in ordered {
                    // => destructure per pair: names read plainly in the format
                    println!("{name} {version}");
                }
            }
            // => the violated rule prints: unnamed block or floating version
            Err(reason) => println!("refused: {reason}"),
        },
        // => reachable only when the mount is missing: harness, not content
        Err(reason) => println!("{reason}"),
    }
}
