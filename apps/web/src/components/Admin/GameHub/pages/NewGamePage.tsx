import { HEY_API_URL } from "@hey/data/constants";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NewGamePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [categories, setCategories] = useState("");
  const [pkg, setPkg] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!title || !slug || !description || !pkg) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("title", title);
    fd.append("slug", slug);
    fd.append("description", description);
    fd.append("instructions", instructions);
    fd.append("width", String(width));
    fd.append("height", String(height));
    fd.append("categories", categories);
    fd.append("package", pkg);
    if (icon) fd.append("icon", icon);
    if (cover) fd.append("cover", cover);

    const res = await fetch(`${HEY_API_URL}/games/manage`, {
      body: fd,
      method: "POST"
    });
    if (!res.ok) {
      setBusy(false);
      alert("Failed to create game");
      return;
    }
    navigate("/admin/games?status=success&message=Game%20created");
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h1 className="font-semibold text-gray-900 text-xl dark:text-white">
        Add Game
      </h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          className="rounded border p-2"
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          value={title}
        />
        <input
          className="rounded border p-2"
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug (kebab-case)"
          value={slug}
        />
        <textarea
          className="rounded border p-2 md:col-span-2"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          value={description}
        />
        <textarea
          className="rounded border p-2 md:col-span-2"
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instructions (optional)"
          value={instructions}
        />
        <input
          className="rounded border p-2"
          onChange={(e) => setWidth(Number(e.target.value))}
          placeholder="Width"
          type="number"
          value={width}
        />
        <input
          className="rounded border p-2"
          onChange={(e) => setHeight(Number(e.target.value))}
          placeholder="Height"
          type="number"
          value={height}
        />
        <input
          className="rounded border p-2 md:col-span-2"
          onChange={(e) => setCategories(e.target.value)}
          placeholder="Categories (comma separated)"
          value={categories}
        />
        <div className="space-y-3 md:col-span-2">
          <div>
            <span className="block text-sm">Game ZIP</span>
            <input
              accept=".zip"
              onChange={(e) => setPkg(e.target.files?.[0] ?? null)}
              type="file"
            />
          </div>
          <div>
            <span className="block text-sm">Icon</span>
            <input
              accept="image/*"
              onChange={(e) => setIcon(e.target.files?.[0] ?? null)}
              type="file"
            />
          </div>
          <div>
            <span className="block text-sm">Cover</span>
            <input
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              type="file"
            />
          </div>
        </div>
      </div>
      <button
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        disabled={busy}
        onClick={handleCreate}
      >
        {busy ? "Saving…" : "Create"}
      </button>
    </div>
  );
};

export default NewGamePage;
