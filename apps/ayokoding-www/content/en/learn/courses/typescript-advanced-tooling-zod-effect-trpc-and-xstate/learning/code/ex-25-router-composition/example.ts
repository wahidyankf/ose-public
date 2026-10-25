// => Worked Example 25: routers merge; names stay unique by path.
// => co-07: in tRPC this is mergeRouters(userRouter, postRouter): one app router from many.
type Handler = (input: unknown) => string; // => every procedure ends in a string reply here
interface Router {
  // => a router: a name plus its procedure table
  label: string; // => which domain this router owns
  routes: Record<string, Handler>; // => procedure name to handler
}
// => The merge: two tables become one, unless a name exists in both.
function mergeRouters(first: Router, second: Router): { ok: true; router: Router } | { ok: false; clash: string } {
  // => the merge: two tables become one, unless a name exists in both
  // => Every incoming name is checked against the accumulated table.
  for (const name of Object.keys(second.routes)) {
    // => every incoming name is checked against the accumulated table
    if (name in first.routes) {
      // => a clash: merging would silently shadow one handler
      return { ok: false, clash: name }; // => refuse with the clashing name
    } // => no clash for this name: continue
  } // => all names unique: fall through
  const routes: Record<string, Handler> = {}; // => fresh table for the merged router
  // => Copy the first table verbatim into the merged router.
  for (const name of Object.keys(first.routes)) {
    // => copy the first table verbatim
    routes[name] = first.routes[name]; // => first router's handlers
  } // => first copied
  // => Copy the second table verbatim into the merged router.
  for (const name of Object.keys(second.routes)) {
    // => copy the second table verbatim
    routes[name] = second.routes[name]; // => second router's handlers
  } // => second copied
  return { ok: true, router: { label: first.label + "+" + second.label, routes: routes } }; // => one router from two
}
// => A clean merge routes twice; a clashing merge refuses.
function main(): void {
  // => entry point; a clean merge routes twice, a clashing merge refuses
  // => two domain routers with disjoint names merge into one app router
  const users: Router = { label: "users", routes: { getUser: () => "user:Ada" } }; // => user domain
  const posts: Router = { label: "posts", routes: { listPosts: () => "posts:2" } }; // => post domain
  const merged = mergeRouters(users, posts); // => disjoint merge
  // => The clean merge routes both procedures through one table.
  if (merged.ok) {
    // => narrow before reading routes
    console.log(
      "merged: " +
        merged.router.label +
        " getUser=" +
        merged.router.routes["getUser"](null) +
        " listPosts=" +
        merged.router.routes["listPosts"](null),
    ); // => Output: merged: users+posts getUser=user:Ada listPosts=posts:2
  } // => merged done
  // => a second router reusing getUser clashes: the merge names the collision
  const impostors: Router = { label: "impostors", routes: { getUser: () => "user:mallory" } }; // => clashing domain
  const clashed = mergeRouters(users, impostors); // => overlapping merge
  if (!clashed.ok) {
    // => the refusal names the duplicated procedure
    console.log("clash: " + clashed.clash); // => Output: clash: getUser
  } // => clashed done
}
main(); // => run once; a throw exits nonzero
