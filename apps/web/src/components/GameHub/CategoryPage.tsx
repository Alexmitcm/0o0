import { HEY_API_URL } from "@hey/data/constants";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

interface CardGame {
  id: string;
  slug: string;
  title: string;
  thumb1Url?: string;
}

const PAGE_SIZE = 20;

const CategoryPage = () => {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const [games, setGames] = useState<CardGame[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => slug?.replace(/-/g, " ") || "Category", [slug]);

  const load = async () => {
    try {
      const qs = new URLSearchParams({
        category: slug || "",
        limit: String(PAGE_SIZE),
        page: String(page)
      });
      const res = await fetch(`${HEY_API_URL}/games?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to load category games");
      const data = await res.json();
      setGames(
        (data.games || []).map((g: any) => ({
          id: g.id,
          slug: g.slug,
          thumb1Url: g.thumb1Url,
          title: g.title
        }))
      );
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, page]);

  const go = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next, { replace: true });
    setPage(p);
  };

  if (!slug) return null;
  if (error) return null;

  return (
    <div className="space-y-4">
      <div className="font-semibold text-gray-900 text-lg capitalize dark:text-gray-100">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {games.map((g) => (
          <a
            className="group block rounded bg-gray-50 p-2 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
            href={`/gaming-dashboard/game/${g.slug}`}
            key={g.id}
          >
            <img
              alt={g.title}
              className="h-24 w-full rounded object-cover"
              src={g.thumb1Url || ""}
            />
            <div className="mt-2 line-clamp-2 text-gray-800 text-sm group-hover:underline dark:text-gray-200">
              {g.title}
            </div>
          </a>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          type="button"
        >
          Prev
        </button>
        <div className="text-gray-500 text-xs dark:text-gray-400">
          Page {page} of {totalPages}
        </div>
        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CategoryPage;
