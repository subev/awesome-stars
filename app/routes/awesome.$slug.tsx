import { data, redirect } from "react-router";
import { AWESOME_LISTS } from "~/lists";
import type { Route } from "./+types/awesome.$slug";

export function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  const listConfig = AWESOME_LISTS[slug];

  if (!listConfig) {
    throw data("List not found", { status: 404 });
  }

  return redirect(`/awesome/${listConfig.owner}/${listConfig.repo}`);
}
