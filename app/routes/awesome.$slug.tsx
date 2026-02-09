import { promises as fs } from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeExternalLinks from "rehype-external-links";
import { data, useLoaderData } from "react-router";
import { AWESOME_LISTS } from "~/lists";
import type { Route } from "./+types/awesome.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  const listConfig = AWESOME_LISTS[slug];

  if (!listConfig) {
    throw data("List not found", { status: 404 });
  }

  const filePath = path.resolve(`public/${slug}-markdownWithStars.md`);

  try {
    const markdown = await fs.readFile(filePath, "utf-8");
    return { markdown, name: listConfig.name };
  } catch {
    throw data(
      `Markdown file not found. Run "npm run fetch-stars:${slug}" first.`,
      { status: 404 },
    );
  }
}

export default function AwesomeList() {
  const { markdown, name } = useLoaderData<typeof loader>();

  return (
    <div className="prose prose-sm prose-a:text-blue-600 max-w-none p-5 prose-ul:marker:text-gray-500">
      <div className="mb-4">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; All lists
        </a>
      </div>
      <h1 className="sr-only">{name} with Stars</h1>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeAutolinkHeadings,
          rehypeSlug,
          [
            rehypeExternalLinks,
            { target: "_blank", rel: ["noopener", "noreferrer"] },
          ],
        ]}
      >
        {markdown || ""}
      </ReactMarkdown>
    </div>
  );
}
