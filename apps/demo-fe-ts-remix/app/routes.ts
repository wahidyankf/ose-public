import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("profile", "routes/profile.tsx"),
  route("admin", "routes/admin.tsx"),
  route("tokens", "routes/tokens.tsx"),
  route("expenses", "routes/expenses._index.tsx"),
  route("expenses/new", "routes/expenses.new.tsx"),
  route("expenses/summary", "routes/expenses.summary.tsx"),
  route("expenses/:id", "routes/expenses.$id.tsx"),
] satisfies RouteConfig;
