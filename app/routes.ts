import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("awesome/:slug", "routes/awesome.$slug.tsx"),
  route("awesome/:owner/:repo", "routes/awesome.$owner.$repo.tsx"),
  route(
    "awesome/:owner/:repo/trends",
    "routes/awesome.$owner.$repo.trends.tsx",
  ),
  route("welcome", "routes/home.tsx"),
] satisfies RouteConfig;
