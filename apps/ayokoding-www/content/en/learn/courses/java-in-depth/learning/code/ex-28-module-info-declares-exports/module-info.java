// module-info.java: the module contract for dues.
// The descriptor names the module and exports exactly one package,
// so consumers compile against the promise, not the internals.
module dues {
  // => the module name every consumer requires
  exports dues; // => the one package the world may use
} // => descriptor ends: two lines, the whole public surface
