// Example 32: Cargo.toml Declares the Crate.
//
// The manifest is the crate's contract: name, version, and edition pin
// what the crate calls itself, while [dependencies] stays empty here
// because every example in this course is standard-library only. The
// checker below reads the mounted manifest and verifies the three rules
// the lesson teaches: a name exists, the version parses, edition is 2021.
// => the manifest is data, not code: the checker parses, never executes
// => zero dependencies is a choice: no network, no audit, no breakage

use std::collections::HashMap;

// => HashMap holds the package table: keys map to declared values

// check_manifest verifies the three manifest rules over mounted text.
// => HashMap of package keys: "name" maps to its declared value
// => missing keys or bad values become owned refusal strings, never traps
fn check_manifest(text: &str) -> Result<HashMap<String, String>, String> {
    // => &str in, owned out: the table outlives the borrowed text
    // => the package table starts empty: [package] headers fill it below
    let mut package: HashMap<String, String> = HashMap::new();
    // => turbofish pins both sides: String keys, String values
    // => in_package tracks the section: only [package] keys are collected
    let mut in_package = false;
    // => false until [package]: dependencies never flip the flag
    for line in text.lines() {
        // => lines() splits the manifest: one header or key per turn
        // => trim first: manifests indent nothing, but tolerance is cheap
        let line = line.trim();
        // => shadowing reuses the name: raw line becomes clean line
        // => blank lines and comments carry no contract: skip both openly
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        // => section headers switch context: [package] starts collecting
        if line.starts_with('[') {
            in_package = line == "[package]";
            // => exact match only: [dependencies] flips the flag back off
            continue;
        }
        // => only package keys matter to the three rules: the rest is ignored
        if in_package {
            // => the gate holds: dependency keys never reach the table
            if let Some((key, value)) = line.split_once('=') {
                // => shapeless lines skip silently: only key=value rows count
                // => trim quotes and space: values arrive quoted as "1.0.0"
                package.insert(
                    key.trim().to_string(),
                    value.trim().trim_matches('"').to_string(),
                );
                // => later keys overwrite: the last declaration wins, like cargo
            }
        }
    }
    // => rule one: a name must exist, or the crate is anonymous
    if !package.contains_key("name") {
        // => contains_key asks: rule one needs presence, not value
        return Err("manifest [package] has no name".to_string());
        // => owned String leaves: the refusal outlives the function
    }
    // => rule two: the version needs three dot-separated numbers
    match package.get("version") {
        // => get borrows: the table stays whole for the edition check
        Some(version) if version.split('.').count() == 3 => {}
        // => three numbers exactly: 1.0 counts as floating here
        // => the refusal quotes the bad value: the author finds it fast
        _ => {
            return Err(format!(
                "manifest version {:?} is not x.y.z",
                package.get("version")
            ))
        }
        // => {:?} quotes the evidence: the author finds the bad value fast
    }
    // => rule three: this course standardizes on edition 2021 throughout
    match package.get("edition") {
        // => second borrow of the same table: gets never conflict
        Some(edition) if edition == "2021" => {}
        // => string compare, not parse: the edition is a label, not a number
        // => the refusal names the expected edition: 2021, not a guess
        _ => {
            return Err(format!(
                "manifest edition {:?} is not 2021",
                package.get("edition")
            ))
        }
    }
    // => the full table returns: main prints it sorted below
    Ok(package)
}

fn main() {
    // => read then check: the mount provides, the function verifies
    // => the harness mounts the unit folder at /data: the manifest waits there
    let text = std::fs::read_to_string("/data/Cargo.toml")
        // => absolute guest path: the harness mounts the unit folder there
        .map_err(|error| format!("cannot read mounted manifest: {error}"));
    // => map_err wraps IO failure: the message names the missing mount
    // => one match on the read: the parsed table prints sorted, or explains
    match text {
        Ok(text) => match check_manifest(&text) {
            // => nested match, two verdicts: parse the table, then print or refuse
            // => sorted keys print: the golden never depends on hash order
            Ok(package) => {
                let mut keys: Vec<&String> = package.keys().collect();
                // => keys borrow the table: sorting never clones the strings
                keys.sort();
                // => sort before print: byte order, never hash order
                for key in keys {
                    println!("{key} = {:?}", package[key]);
                }
            }
            // => the violated rule prints: name, version, or edition
            Err(reason) => println!("refused: {reason}"),
        },
        // => reachable only when the mount is missing: harness, not content
        Err(reason) => println!("{reason}"),
    }
}
