import { HEY_API_URL } from "@hey/data/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { hydrateAuthTokens } from "../../../store/persisted/useAuthStore";
import Button from "../../Shared/UI/Button";

const uploadGameSchema = z.object({
  categories: z.array(z.string()).min(1, "At least one category is required"),
  description: z.string().optional(),
  gameType: z.enum(["FreeToPlay", "PlayToEarn"]).default("FreeToPlay"),
  height: z.number().min(240).max(1080).default(720),
  instructions: z.string().optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(15, "Slug must be less than 15 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  width: z.number().min(320).max(1920).default(1280)
});

const UploadGameTab = () => {
  const uid = useId();
  const titleId = `${uid}-title`;
  const slugId = `${uid}-slug`;
  const descriptionId = `${uid}-description`;
  const instructionsId = `${uid}-instructions`;
  const gameFileId = `${uid}-gameFile`;
  const cardCoverId = `${uid}-cardCover`;
  const thumb2Id = `${uid}-thumb2`;
  const widthId = `${uid}-width`;
  const heightId = `${uid}-height`;
  const categoriesId = `${uid}-categories`;

  const [formData, setFormData] = useState({
    categories: [] as string[],
    description: "",
    gameType: "FreeToPlay" as "FreeToPlay" | "PlayToEarn",
    height: 720,
    instructions: "",
    slug: "",
    title: "",
    width: 1280
  });
  const [files, setFiles] = useState({
    cardCover: null as File | null,
    gameFile: null as File | null,
    thumb2: null as File | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (data: any) => {
      const formDataToSend = new FormData();

      // Add form data
      for (const [key, value] of Object.entries(data)) {
        if (key === "categories") {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, value as string);
        }
      }

      // Add files
      if (files.gameFile) formDataToSend.append("gameFile", files.gameFile);
      if (files.cardCover) formDataToSend.append("cardCover", files.cardCover);
      if (files.thumb2) formDataToSend.append("thumb2", files.thumb2);

      const { accessToken } = hydrateAuthTokens();

      const response = await fetch(`${HEY_API_URL}/games/upload`, {
        body: formDataToSend,
        headers: {
          Authorization: `Bearer ${accessToken || ""}`
        },
        method: "POST"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to upload game (${response.status})`
        );
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload game");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      toast.success("Game uploaded successfully!");
      // Reset form
      setFormData({
        categories: [],
        description: "",
        gameType: "FreeToPlay" as "FreeToPlay" | "PlayToEarn",
        height: 720,
        instructions: "",
        slug: "",
        title: "",
        width: 1280
      });
      setFiles({ cardCover: null, gameFile: null, thumb2: null });
      setErrors({});
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { accessToken } = hydrateAuthTokens();
    if (!accessToken) {
      toast.error("Please sign in to upload games");
      return;
    }

    try {
      const validatedData = uploadGameSchema.parse(formData);
      uploadMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        for (const err of error.errors) {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        }
        setErrors(newErrors);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <h3 className="font-medium text-blue-900 text-lg dark:text-blue-100">
          Upload Requirements
        </h3>
        <ul className="mt-2 text-blue-800 text-sm dark:text-blue-200">
          <li>• Game file must be a ZIP containing index.html in the root</li>
          <li>• Must include thumb_1.jpg (512x384px) in the root</li>
          <li>• Must include thumb_2.jpg (512x512px) in the root</li>
        </ul>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Title */}
          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor={titleId}
            >
              Game Title *
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id={titleId}
              onChange={(e) => handleInputChange("title", e.target.value)}
              type="text"
              value={formData.title}
            />
            {errors.title && (
              <p className="mt-1 text-red-600 text-sm dark:text-red-400">
                {errors.title}
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor={slugId}
            >
              Game Slug *
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id={slugId}
              onChange={(e) => handleInputChange("slug", e.target.value)}
              placeholder="game-title"
              type="text"
              value={formData.slug}
            />
            {errors.slug && (
              <p className="mt-1 text-red-600 text-sm dark:text-red-400">
                {errors.slug}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            className="block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor={descriptionId}
          >
            Description
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id={descriptionId}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
            value={formData.description}
          />
        </div>

        {/* Instructions */}
        <div>
          <label
            className="block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor={instructionsId}
          >
            Instructions
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id={instructionsId}
            onChange={(e) => handleInputChange("instructions", e.target.value)}
            rows={3}
            value={formData.instructions}
          />
        </div>

        {/* Game Type */}
        <div>
          <label
            className="block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor={`${uid}-gameType`}
          >
            Game Type *
          </label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id={`${uid}-gameType`}
            onChange={(e) =>
              handleInputChange(
                "gameType",
                e.target.value as "FreeToPlay" | "PlayToEarn"
              )
            }
            value={formData.gameType}
          >
            <option value="FreeToPlay">🎮 Free to Play Games</option>
            <option value="PlayToEarn">💰 Play to Earn Games</option>
          </select>
          <p className="mt-1 text-gray-500 text-xs dark:text-gray-400">
            Free to Play games are available to all users. Play to Earn games
            require premium subscription.
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor={gameFileId}
            >
              Game File (.zip) *
            </label>
            <input
              accept=".zip"
              className="mt-1 block w-full text-gray-500 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/20 dark:file:text-blue-300"
              id={gameFileId}
              onChange={(e) =>
                handleFileChange("gameFile", e.target.files?.[0] || null)
              }
              type="file"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                htmlFor={cardCoverId}
              >
                Card Cover (recommended 1280x720) *
              </label>
              <input
                accept="image/*"
                className="mt-1 block w-full text-gray-500 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                id={cardCoverId}
                onChange={(e) =>
                  handleFileChange("cardCover", e.target.files?.[0] || null)
                }
                type="file"
              />
            </div>

            <div>
              <label
                className="block font-medium text-gray-700 text-sm dark:text-gray-300"
                htmlFor={thumb2Id}
              >
                Optional Icon (512x512)
              </label>
              <input
                accept="image/*"
                className="mt-1 block w-full text-gray-500 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                id={thumb2Id}
                onChange={(e) =>
                  handleFileChange("thumb2", e.target.files?.[0] || null)
                }
                type="file"
              />
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor={widthId}
            >
              Game Width
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id={widthId}
              max={1920}
              min={320}
              onChange={(e) =>
                handleInputChange("width", Number.parseInt(e.target.value, 10))
              }
              type="number"
              value={formData.width}
            />
          </div>

          <div>
            <label
              className="block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor={heightId}
            >
              Game Height
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              id={heightId}
              max={1080}
              min={240}
              onChange={(e) =>
                handleInputChange("height", Number.parseInt(e.target.value, 10))
              }
              type="number"
              value={formData.height}
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <label
            className="block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor={categoriesId}
          >
            Categories *
          </label>
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            id={categoriesId}
            multiple
            onChange={(e) => {
              const selected = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              handleInputChange("categories", selected);
            }}
            size={8}
            value={formData.categories}
          >
            <option value="Action">Action</option>
            <option value="Adventure">Adventure</option>
            <option value="Arcade">Arcade</option>
            <option value="Puzzle">Puzzle</option>
            <option value="Racing">Racing</option>
            <option value="Shooting">Shooting</option>
            <option value="Sports">Sports</option>
            <option value="Strategy">Strategy</option>
          </select>
          {errors.categories && (
            <p className="mt-1 text-red-600 text-sm dark:text-red-400">
              {errors.categories}
            </p>
          )}
        </div>

        <Button
          className="w-full"
          disabled={uploadMutation.isPending}
          loading={uploadMutation.isPending}
          type="submit"
        >
          Upload Game
        </Button>
      </form>
    </div>
  );
};

export default UploadGameTab;
