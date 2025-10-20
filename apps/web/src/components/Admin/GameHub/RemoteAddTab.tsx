import { HEY_API_URL } from "@hey/data/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { hydrateAuthTokens } from "../../../store/persisted/useAuthStore";
import Button from "../../Shared/UI/Button";

interface CategoryOption {
  id: string;
  name: string;
}

const remoteAddSchema = z.object({
  categoryIds: z.array(z.string()).min(1, "Select at least one category"),
  coverImageUrl: z.string().url("Enter a valid cover image URL"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  gameUrl: z.string().url("Enter a valid game URL"),
  height: z.number().min(240).max(1080).default(720),
  iconUrl: z.string().url("Enter a valid icon URL"),
  instructions: z.string().optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(15, "Slug must be less than 15 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  title: z.string().min(1, "Title is required").max(100),
  width: z.number().min(320).max(1920).default(1280)
});

const parseGameUrl = (
  rawUrl: string
): { packageUrl: string; entryFilePath: string } => {
  try {
    const u = new URL(rawUrl);
    const path = u.pathname || "/";
    const last = path.split("/").filter(Boolean).pop() || "";
    const looksLikeFile = /\.[a-z0-9]+$/i.test(last);
    const entryFilePath = looksLikeFile ? last : "index.html";
    const basePath = looksLikeFile
      ? path.slice(0, path.length - last.length)
      : path;
    const normalizedBase = basePath.endsWith("/")
      ? basePath.slice(0, -1)
      : basePath;
    return { entryFilePath, packageUrl: `${u.origin}${normalizedBase}` };
  } catch {
    // Fallback: treat full string as base, assume index.html
    return {
      entryFilePath: "index.html",
      packageUrl: rawUrl.replace(/\/$/, "")
    };
  }
};

const RemoteAddTab = () => {
  const [formData, setFormData] = useState({
    categoryIds: [] as string[],
    coverImageUrl: "",
    description: "",
    gameUrl: "",
    height: 720,
    iconUrl: "",
    instructions: "",
    slug: "",
    title: "",
    width: 1280
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  // Load categories
  const categoriesQuery = useQuery({
    queryFn: async (): Promise<CategoryOption[]> => {
      const resp = await fetch(`${HEY_API_URL}/games/categories`);
      if (!resp.ok) throw new Error("Failed to load categories");
      const data = await resp.json();
      return (data.categories || []).map((c: any) => ({
        id: c.id,
        name: c.name
      }));
    },
    queryKey: ["game-categories"]
  });

  // Ensure we always have an array for rendering options
  const categoryOptions: CategoryOption[] = Array.isArray(categoriesQuery.data)
    ? (categoriesQuery.data as CategoryOption[])
    : [];

  // Mutation to create game via management API
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { accessToken } = hydrateAuthTokens();
      const resp = await fetch(`${HEY_API_URL}/games/manage`, {
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${accessToken || ""}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e?.error || `Failed to add game (${resp.status})`);
      }
      return resp.json();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add game");
    },
    onSuccess: () => {
      toast.success("Game added successfully");
      queryClient.invalidateQueries({ queryKey: ["games"] });
      setFormData({
        categoryIds: [],
        coverImageUrl: "",
        description: "",
        gameUrl: "",
        height: 720,
        iconUrl: "",
        instructions: "",
        slug: "",
        title: "",
        width: 1280
      });
      setErrors({});
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { accessToken } = hydrateAuthTokens();
    if (!accessToken) {
      toast.error("Please sign in to add games");
      return;
    }

    try {
      const validated = remoteAddSchema.parse(formData);
      const { packageUrl, entryFilePath } = parseGameUrl(validated.gameUrl);

      createMutation.mutate({
        categoryIds: validated.categoryIds,
        coverImageUrl: validated.coverImageUrl,
        description: validated.description,
        entryFilePath,
        height: validated.height,
        iconUrl: validated.iconUrl,
        instructions: validated.instructions,
        packageUrl,
        slug: validated.slug,
        status: "Published",
        title: validated.title,
        width: validated.width
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        for (const err of error.errors) {
          const key = String(err.path?.[0] ?? "");
          if (key) newErrors[key] = err.message;
        }
        setErrors(newErrors);
      }
    }
  };

  useEffect(() => {
    // Auto-suggest slug from title
    if (formData.title && !formData.slug) {
      const suggestion = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 15);
      if (suggestion) setFormData((p) => ({ ...p, slug: suggestion }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.title]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
        <h3 className="font-medium text-green-900 text-lg dark:text-green-100">
          Add Remote Games
        </h3>
        <p className="mt-2 text-green-800 text-sm dark:text-green-200">
          Add games hosted on external servers by providing their URLs and
          metadata.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="title"
            >
              Game Title *
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id="title"
              onChange={(e) => handleInputChange("title", e.target.value)}
              type="text"
              value={formData.title}
            />
            {errors.title && (
              <p className="mt-1 text-red-400 text-sm dark:text-red-400">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="slug"
            >
              Game Slug *
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id="slug"
              onChange={(e) => handleInputChange("slug", e.target.value)}
              placeholder="game-title"
              type="text"
              value={formData.slug}
            />
            {errors.slug && (
              <p className="mt-1 text-red-400 text-sm dark:text-red-400">
                {errors.slug}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            className="block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor="description"
          >
            Description *
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="description"
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
            value={formData.description}
          />
          {errors.description && (
            <p className="mt-1 text-red-400 text-sm dark:text-red-400">
              {errors.description}
            </p>
          )}
        </div>

        <div>
          <label
            className="block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor="instructions"
          >
            Instructions
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="instructions"
            onChange={(e) => handleInputChange("instructions", e.target.value)}
            rows={3}
            value={formData.instructions}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="coverImageUrl"
            >
              Thumbnail 512x384 (Cover) *
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id="coverImageUrl"
              onChange={(e) =>
                handleInputChange("coverImageUrl", e.target.value)
              }
              placeholder="https://example.com/thumb_1.jpg"
              type="url"
              value={formData.coverImageUrl}
            />
            {errors.coverImageUrl && (
              <p className="mt-1 text-red-400 text-sm dark:text-red-400">
                {errors.coverImageUrl}
              </p>
            )}
          </div>

          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="iconUrl"
            >
              Thumbnail 512x512 (Icon) *
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id="iconUrl"
              onChange={(e) => handleInputChange("iconUrl", e.target.value)}
              placeholder="https://example.com/thumb_2.jpg"
              type="url"
              value={formData.iconUrl}
            />
            {errors.iconUrl && (
              <p className="mt-1 text-red-400 text-sm dark:text-red-400">
                {errors.iconUrl}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            className="block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor="gameUrl"
          >
            Game URL (full, e.g. https://host/game/index.html) *
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="gameUrl"
            onChange={(e) => handleInputChange("gameUrl", e.target.value)}
            placeholder="https://example.com/yourgames/index.html"
            type="url"
            value={formData.gameUrl}
          />
          {errors.gameUrl && (
            <p className="mt-1 text-red-400 text-sm dark:text-red-400">
              {errors.gameUrl}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="width"
            >
              Game Width
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id="width"
              max={1920}
              min={320}
              onChange={(e) =>
                handleInputChange("width", Number.parseInt(e.target.value))
              }
              type="number"
              value={formData.width}
            />
          </div>

          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="height"
            >
              Game Height
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id="height"
              max={1080}
              min={240}
              onChange={(e) =>
                handleInputChange("height", Number.parseInt(e.target.value))
              }
              type="number"
              value={formData.height}
            />
          </div>
        </div>

        <div>
          <label
            className="block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor="categories"
          >
            Categories *
          </label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id="categories"
            multiple
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(
                (o) => o.value
              );
              handleInputChange("categoryIds", selected);
            }}
            size={8}
            value={formData.categoryIds}
          >
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryIds && (
            <p className="mt-1 text-red-400 text-sm dark:text-red-400">
              {errors.categoryIds}
            </p>
          )}
        </div>

        <Button
          aria-label="Add game"
          className="w-full"
          disabled={createMutation.isPending || categoriesQuery.isLoading}
          loading={createMutation.isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              (e.currentTarget as HTMLButtonElement).click();
          }}
          tabIndex={0}
          type="submit"
        >
          Add Game
        </Button>
      </form>
    </div>
  );
};

export default RemoteAddTab;
