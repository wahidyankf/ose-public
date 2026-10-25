// Example 78: Config Merges in Layers.
//
// Read this like a deployer: defaults ship the safe baseline, the file
// layer overrides for the machine, and arguments override for the run.
// Later layers win per key, earlier layers survive where later ones stay
// silent, and the transcript prints each layer plus the merged result, so
// precedence is visible instead of vibes.
// => HashMap per layer: keys map to values, merges overwrite per key
// => file beats defaults, args beat file: the order is the precedence

use std::collections::HashMap;

// => one map per layer: three layers merge key by key below

// layer builds one named HashMap from fixed pairs, sorted for the transcript.
// => &str pairs keep the fixture readable: names and values in one glance
// => the map owns Strings: layers merge without borrowing each other
fn layer(pairs: &[(&str, &str)]) -> HashMap<String, String> {
    // => borrowed pairs in, owned map out: fixtures read plainly
    pairs
        .iter()
        .map(|(key, value)| (key.to_string(), value.to_string()))
        .collect()
    // => to_string twice: names and values both outlive the fixture
}

// merge folds later layers over earlier ones, key by key, later winning.
// => insert overwrites: the last writer of a key decides its value
// => untouched keys survive: silence in a later layer keeps the earlier value
fn merge(layers: &[HashMap<String, String>]) -> HashMap<String, String> {
    // => borrowed layers in, owned merge out: callers keep their maps
    // => the merged map starts empty: each layer overwrites into it in turn
    let mut merged: HashMap<String, String> = HashMap::new();
    for config in layers {
        // => outer loop in precedence order: defaults first, args last
        for (key, value) in config {
            // => iteration borrows: keys and values lend, never leave
            merged.insert(key.clone(), value.clone());
            // => clone both: the merge owns what the layers only lend
        }
    }
    // => the merged map returns: main prints it sorted below
    merged
}

// show prints one layer sorted by key: HashMap order never reaches output.
// => sorted keys print: every layer reads alphabetically in the transcript
// => the same printer serves all three layers and the merged result
fn show(title: &str, config: &HashMap<String, String>) -> Vec<String> {
    // => owned lines leave: the transcript prints after borrowing ends
    // => collect and sort: iteration order is never printed raw, see Ex.6
    let mut keys: Vec<&String> = config.keys().collect();
    // => keys borrow the map: sorting never clones the strings
    keys.sort();
    // => byte order, never hash order: the transcript stays identical
    // => one line per key: the layer reads as its own sorted table
    keys.iter()
        .map(|key| format!("{title}: {key} = {}", config[*key]))
        .collect()
}

fn main() {
    // => three layers plus the merge: four sorted tables print
    // => defaults ship safe values: quiet port, local host, info level
    let defaults = layer(&[("host", "localhost"), ("port", "3101"), ("level", "info")]);
    // => the file layer overrides for the machine: host and level change
    let file = layer(&[("host", "wasm-worker-3"), ("level", "warn")]);
    // => the args layer overrides for the run: only the port changes here
    let args = layer(&[("port", "8080")]);
    // => each layer prints sorted: defaults, file, args, then the merge
    for line in show("defaults", &defaults) {
        println!("{line}");
    }
    for line in show("file", &file) {
        println!("{line}");
    }
    for line in show("args", &args) {
        println!("{line}");
    }
    // => merged: wasm-worker-3, 8080, warn -- later layers won per key
    for line in show("merged", &merge(&[defaults, file, args])) {
        println!("{line}");
    }
}
