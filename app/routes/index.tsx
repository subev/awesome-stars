import { AWESOME_LISTS } from "~/lists";

export default function Index() {
  const lists = Object.values(AWESOME_LISTS);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-3xl font-bold">Awesome Lists with Stars</h1>
      <p className="mb-8 text-gray-600">
        Curated awesome lists enriched with GitHub star counts.
      </p>
      <ul className="space-y-4">
        {lists.map((list) => (
          <li key={list.slug}>
            <a
              href={`/awesome/${list.slug}`}
              className="block rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              <span className="text-lg font-medium text-blue-600">
                {list.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
