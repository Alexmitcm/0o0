import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { HEY_API_URL } from "@hey/data/constants";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import StatusBanner from "../../Shared/UI/StatusBanner";
import EditCategoryModal from "./EditCategoryModal";

interface Category {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    games: number;
  };
}

const CategoryManagementTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryMetaDescription, setNewCategoryMetaDescription] =
    useState("");
  const [editing, setEditing] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${HEY_API_URL}/games/manage/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    const slug = (newCategorySlug || newCategoryName)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    try {
      const response = await fetch(`${HEY_API_URL}/games/manage/categories`, {
        body: JSON.stringify({
          description: newCategoryDescription || undefined,
          metaDescription: newCategoryMetaDescription || undefined,
          name: newCategoryName.trim(),
          slug
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (response.ok) {
        toast.success("Category created successfully");
        setNewCategoryName("");
        setNewCategorySlug("");
        setNewCategoryDescription("");
        setNewCategoryMetaDescription("");
        setShowCreateModal(false);
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create category");
      }
    } catch (_error) {
      toast.error("Failed to create category");
    }
  };

  const handleDeleteCategory = async (
    categoryId: string,
    gameCount: number
  ) => {
    if (gameCount > 0) {
      toast.error(`Cannot delete category with ${gameCount} games`);
      return;
    }

    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetch(
        `${HEY_API_URL}/games/manage/categories/${categoryId}`,
        {
          method: "DELETE"
        }
      );

      if (response.ok) {
        toast.success("Category deleted successfully");
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete category");
      }
    } catch (_error) {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <StatusBanner />
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">Category Management</h3>
        <button
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          <PlusIcon className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center">Loading categories...</div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                  Games
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 text-xs uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 text-sm dark:text-white">
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-blue-800 text-xs">
                      {category._count.games} games
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm dark:text-gray-400">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => setEditing(category)}
                        type="button"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        aria-label={`Delete ${category.name}`}
                        disabled={category._count.games > 0}
                        onClick={() =>
                          handleDeleteCategory(
                            category.id,
                            category._count.games
                          )
                        }
                        type="button"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 font-medium text-lg">Add new category</h3>
            <div className="space-y-3">
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateCategory()}
                placeholder="Name (e.g., Adventure)"
                type="text"
                value={newCategoryName}
              />
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setNewCategorySlug(e.target.value)}
                placeholder="Slug (e.g., adventure)"
                type="text"
                value={newCategorySlug}
              />
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="(Optional) Category description"
                rows={3}
                value={newCategoryDescription}
              />
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onChange={(e) => setNewCategoryMetaDescription(e.target.value)}
                placeholder="(Optional) Category meta description"
                rows={3}
                value={newCategoryMetaDescription}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCategoryName("");
                  setNewCategorySlug("");
                  setNewCategoryDescription("");
                  setNewCategoryMetaDescription("");
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={handleCreateCategory}
                type="button"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <EditCategoryModal
        category={editing}
        onClose={() => setEditing(null)}
        onSaved={(prevName, nextName) => {
          toast.success(`Category updated! ${prevName} → ${nextName}`);
          setEditing(null);
          fetchCategories();
        }}
        open={Boolean(editing)}
      />
    </div>
  );
};

export default CategoryManagementTab;
