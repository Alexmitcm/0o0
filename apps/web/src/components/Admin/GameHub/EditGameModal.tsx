import { HEY_API_URL } from "@hey/data/constants";
import { useEffect, useMemo, useState } from "react";
import type { Game, GameCategory } from "@/helpers/gameHub";

interface EditGameModalProps {
  open: boolean;
  game: Game | null;
  categories: GameCategory[];
  onClose: () => void;
  onSaved: () => void;
}

const EditGameModal = ({
  open,
  game,
  categories,
  onClose,
  onSaved
}: EditGameModalProps) => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [packageUrl, setPackageUrl] = useState("");
  const [entryFilePath, setEntryFilePath] = useState("index.html");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [status, setStatus] = useState<"Draft" | "Published">("Draft");
  const [gameType, setGameType] = useState<"FreeToPlay" | "PlayToEarn">(
    "FreeToPlay"
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !game) return;
    setTitle(game.title || "");
    setSlug(game.slug || "");
    setDescription(game.description || "");
    setInstructions(game.instructions || "");
    setPackageUrl(game.gameFileUrl || "");
    setEntryFilePath(game.entryFilePath || "index.html");
    setCoverImageUrl(game.thumb1Url || "");
    setIconUrl(game.thumb2Url || "");
    setWidth(game.width || 1280);
    setHeight(game.height || 720);
    setStatus((game.status as any) || "Draft");
    setGameType(game.gameType || "FreeToPlay");
    setSelectedCategoryIds((game.categories || []).map((c) => c.id));
  }, [open, game]);

  const handleToggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canSave = useMemo(() => {
    return (
      title.trim().length > 0 &&
      slug.trim().length >= 3 &&
      packageUrl.trim().length > 0
    );
  }, [title, slug, packageUrl]);

  const handleSave = async () => {
    if (!game) return;
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch(`${HEY_API_URL}/games/manage/${game.id}`, {
        body: JSON.stringify({
          categoryIds: selectedCategoryIds,
          coverImageUrl,
          description,
          entryFilePath,
          gameType,
          height: Number(height),
          iconUrl,
          instructions,
          packageUrl,
          slug,
          status,
          title,
          width: Number(width)
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT"
      });
      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert("Failed to save game");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open || !game) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-full flex-col rounded-lg bg-white shadow-lg sm:max-w-2xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 text-lg dark:text-gray-100">
            Edit game
          </h3>
          <button
            aria-label="Close"
            className="rounded p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700"
            onClick={onClose}
            onKeyDown={(e) => e.key === "Enter" && onClose()}
            tabIndex={0}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="game-title" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                Game Title
              </label>
              <input
                id="game-title"
                className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setTitle(e.target.value)}
                value={title}
              />
            </div>
            <div>
              <label htmlFor="game-slug" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                Game Slug
              </label>
              <input
                id="game-slug"
                className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setSlug(e.target.value)}
                value={slug}
              />
            </div>
            <div>
              <label htmlFor="game-description" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                Description
              </label>
              <textarea
                id="game-description"
                className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                value={description}
              />
            </div>
            <div>
              <label htmlFor="game-instructions" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                Instructions
              </label>
              <textarea
                id="game-instructions"
                className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                value={instructions}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="game-url" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                  Game URL (base)
                </label>
                <input
                  id="game-url"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setPackageUrl(e.target.value)}
                  placeholder="/uploads/games/abcd/stack/index.html (without file, if using base)"
                  value={packageUrl}
                />
              </div>
              <div>
                <label htmlFor="entry-file" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                  Entry file
                </label>
                <input
                  id="entry-file"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setEntryFilePath(e.target.value)}
                  placeholder="index.html"
                  value={entryFilePath}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="card-cover-url" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                  Card Cover URL
                </label>
                <input
                  id="card-cover-url"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  value={coverImageUrl}
                />
              </div>
              <div>
                <label htmlFor="icon-url" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                  Icon URL
                </label>
                <input
                  id="icon-url"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setIconUrl(e.target.value)}
                  value={iconUrl}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="game-type" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                  Game Type
                </label>
                <select
                  id="game-type"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) =>
                    setGameType(e.target.value as "FreeToPlay" | "PlayToEarn")
                  }
                  value={gameType}
                >
                  <option value="FreeToPlay">🎮 Free to Play Games</option>
                  <option value="PlayToEarn">💰 Play to Earn Games</option>
                </select>
                <p className="mt-1 text-gray-500 text-xs dark:text-gray-400">
                  Free to Play games are available to all users. Play to Earn
                  games require premium subscription.
                </p>
              </div>
              <div>
                <label htmlFor="game-status" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                  Status
                </label>
                <select
                  id="game-status"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setStatus(e.target.value as any)}
                  value={status}
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="game-width" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                  Width
                </label>
                <input
                  id="game-width"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setWidth(Number(e.target.value))}
                  type="number"
                  value={width}
                />
              </div>
              <div>
                <label htmlFor="game-height" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                  Height
                </label>
                <input
                  id="game-height"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  onChange={(e) => setHeight(Number(e.target.value))}
                  type="number"
                  value={height}
                />
              </div>
            </div>

            <div>
              <label htmlFor="game-category" className="mb-1 block text-gray-600 text-sm dark:text-gray-300">
                Game category
              </label>
              <div className="max-h-40 overflow-auto rounded border border-gray-200 p-2 dark:border-gray-700">
                {categories.map((c) => (
                  <label
                    className="mb-1 flex items-center gap-2 text-gray-700 text-sm dark:text-gray-200"
                    key={c.id}
                  >
                    <input
                      checked={selectedCategoryIds.includes(c.id)}
                      onChange={() => handleToggleCategory(c.id)}
                      type="checkbox"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3 dark:border-gray-700">
          <button
            className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={!canSave || saving}
            onClick={handleSave}
            type="button"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGameModal;
