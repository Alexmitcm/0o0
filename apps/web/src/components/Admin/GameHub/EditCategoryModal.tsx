import { HEY_API_URL } from "@hey/data/constants";
import { useEffect, useMemo, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  metaDescription?: string;
}

interface EditCategoryModalProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved: (prevName: string, nextName: string) => void;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const EditCategoryModal = ({
  open,
  category,
  onClose,
  onSaved
}: EditCategoryModalProps) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !category) return;
    setName(category.name);
    setSlug(category.slug || "");
    setDescription(category.description || "");
    setMetaDescription(category.metaDescription || "");
  }, [open, category]);

  const computedSlug = useMemo(
    () => (slug ? slugify(slug) : slugify(name)),
    [slug, name]
  );
  const canSave = name.trim().length >= 2;

  const handleSave = async () => {
    if (!category) return;
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${HEY_API_URL}/games/manage/categories/${category.id}`,
        {
          body: JSON.stringify({
            description,
            metaDescription,
            name,
            slug: computedSlug
          }),
          headers: { "Content-Type": "application/json" },
          method: "PUT"
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // eslint-disable-next-line no-alert
        alert(err.error || "Failed to update category");
        return;
      }
      onSaved(category.name, name);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-gray-800">
        <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 text-lg dark:text-gray-100">
            Edit category
          </h3>
          <button
            aria-label="Close"
            className="rounded p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-4">
          <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-900 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-200">
            Changing category name will update how this category appears on all
            games.
          </div>
          <label
            className="mb-1 block text-gray-600 text-sm dark:text-gray-300"
            htmlFor="category-name"
          >
            Category Name
          </label>
          <input
            className="mb-3 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="category-name"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          <label
            className="mb-1 block text-gray-600 text-sm dark:text-gray-300"
            htmlFor="category-slug"
          >
            Category Slug
          </label>
          <input
            className="mb-3 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="category-slug"
            onChange={(e) => setSlug(e.target.value)}
            placeholder="online-games"
            value={slug}
          />
          <label
            className="mb-1 block text-gray-600 text-sm dark:text-gray-300"
            htmlFor="category-description"
          >
            Description
          </label>
          <textarea
            className="mb-3 w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="category-description"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="(Optional) Category description"
            rows={3}
            value={description}
          />
          <label
            className="mb-1 block text-gray-600 text-sm dark:text-gray-300"
            htmlFor="category-meta-description"
          >
            Meta Description
          </label>
          <textarea
            className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="category-meta-description"
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="(Optional) Category meta description"
            rows={3}
            value={metaDescription}
          />
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

export default EditCategoryModal;
