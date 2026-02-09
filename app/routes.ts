import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("awesome/:slug", "routes/awesome.$slug.tsx"),
  route("welcome", "routes/home.tsx"),
] satisfies RouteConfig;
