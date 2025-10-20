import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Shared/UI/Button";
import { Input } from "@/components/Shared/UI/Input";
import { Select } from "@/components/Shared/UI/Select";
import TextArea from "@/components/Shared/UI/TextArea";
import { gameHubApi } from "@/lib/api/gameHubApi";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface GameSubmissionData {
  title: string;
  description: string;
  gameType: "html5" | "unity" | "phaser" | "construct3" | "other";
  category: string;
  tags: string[];
  gameFile?: File;
  thumbnail?: File;
  screenshots?: File[];
  website?: string;
  developer?: string;
  version?: string;
  instructions?: string;
}

const SubmitGame = () => {
  const navigate = useNavigate();
  const { currentAccount } = useAccountStore();
  const [formData, setFormData] = useState<GameSubmissionData>({
    category: "",
    description: "",
    developer: "",
    gameType: "html5",
    instructions: "",
    tags: [],
    title: "",
    version: "",
    website: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const gameTypes = [
    { label: "HTML5 Game", value: "html5", selected: true },
    { label: "Unity WebGL", value: "unity" },
    { label: "Phaser.js", value: "phaser" },
    { label: "Construct 3", value: "construct3" },
    { label: "Other", value: "other" }
  ];

  const categories = [
    { label: "Action", value: "action" },
    { label: "Puzzle", value: "puzzle" },
    { label: "Strategy", value: "strategy" },
    { label: "Arcade", value: "arcade" },
    { label: "Racing", value: "racing" },
    { label: "Sports", value: "sports" },
    { label: "Adventure", value: "adventure" },
    { label: "Simulation", value: "simulation" }
  ];

  const handleInputChange = (
    field: keyof GameSubmissionData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (
    field: keyof GameSubmissionData,
    files: FileList | null
  ) => {
    if (!files) return;

    if (field === "screenshots") {
      setFormData((prev) => ({
        ...prev,
        [field]: Array.from(files)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: files[0]
      }));
    }
  };

  const handleTagInput = (value: string) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setFormData((prev) => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentAccount) {
      setError("Please connect your wallet to submit a game");
      return;
    }

    if (!formData.title || !formData.description || !formData.category) {
      setError("Please fill in all required fields");
      return;
    }

    if (!formData.gameFile) {
      setError("Please upload a game file");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const submissionData = {
        ...formData,
        status: "pending",
        walletAddress: currentAccount.address
      };

      await gameHubApi.submitGame(submissionData);
      setSuccess(true);

      // Redirect to games list after 2 seconds
      setTimeout(() => {
        navigate("/gaming-dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit game");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold text-green-900 text-lg dark:text-green-100">
            Game Submitted Successfully!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Your game has been submitted for review. You'll be notified once
            it's approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="font-bold text-3xl text-gray-900 dark:text-white">
          Submit Your Game
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Share your creation with the gaming community
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
                Game Title *
              </label>
              <Input
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter game title"
                required
                value={formData.title}
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
                Description *
              </label>
              <TextArea
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your game..."
                required
                rows={4}
                value={formData.description}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
                  Game Type *
                </label>
                <Select
                  onChange={(value) => handleInputChange("gameType", String(value))}
                  options={gameTypes.map((t) => ({
                    label: t.label,
                    selected: t.value === formData.gameType,
                    value: t.value
                  }))}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
                  Category *
                </label>
                <Select
                  onChange={(value) => handleInputChange("category", String(value))}
                  options={categories.map((c) => ({
                    label: c.label,
                    selected: c.value === formData.category,
                    value: c.value
                  }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
                Tags
              </label>
              <Input
                onChange={(e) => handleTagInput(e.target.value)}
                placeholder="Enter tags separated by commas (e.g., action, multiplayer, puzzle)"
                value={formData.tags.join(", ")}
              />
            </div>
          </div>
        </div>

        {/* Game Files */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Game Files
          </h2>

          <div className="space-y-4">
            <div>
              <label
                className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300"
                htmlFor="gameFile"
              >
                Game File *
              </label>
              <input
                accept=".zip,.html,.js"
                aria-describedby="gameFileHelp"
                className="block w-full text-gray-900 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                id="gameFile"
                onChange={(e) => handleFileChange("gameFile", e.target.files)}
                required
                type="file"
              />
              <p
                className="mt-1 text-gray-500 text-xs dark:text-gray-400"
                id="gameFileHelp"
              >
                Upload your game files as a ZIP archive or HTML file
              </p>
            </div>

            <div>
              <label
                className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300"
                htmlFor="thumbnail"
              >
                Thumbnail Image
              </label>
              <input
                accept="image/*"
                aria-describedby="thumbnailHelp"
                className="block w-full text-gray-900 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                id="thumbnail"
                onChange={(e) => handleFileChange("thumbnail", e.target.files)}
                type="file"
              />
              <p
                className="mt-1 text-gray-500 text-xs dark:text-gray-400"
                id="thumbnailHelp"
              >
                Recommended size: 300x200px
              </p>
            </div>

            <div>
              <label
                className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300"
                htmlFor="screenshots"
              >
                Screenshots
              </label>
              <input
                accept="image/*"
                aria-describedby="screenshotsHelp"
                className="block w-full text-gray-900 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 file:text-sm hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                id="screenshots"
                multiple
                onChange={(e) =>
                  handleFileChange("screenshots", e.target.files)
                }
                type="file"
              />
              <p
                className="mt-1 text-gray-500 text-xs dark:text-gray-400"
                id="screenshotsHelp"
              >
                Upload up to 5 screenshots of your game
              </p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Additional Information
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
                  Developer Name
                </label>
                <Input
                  onChange={(e) =>
                    handleInputChange("developer", e.target.value)
                  }
                  placeholder="Your name or studio"
                  value={formData.developer}
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
                  Version
                </label>
                <Input
                  onChange={(e) => handleInputChange("version", e.target.value)}
                  placeholder="1.0.0"
                  value={formData.version}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
                Website
              </label>
              <Input
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://yourgame.com"
                type="url"
                value={formData.website}
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
                How to Play
              </label>
              <TextArea
                onChange={(e) =>
                  handleInputChange("instructions", e.target.value)
                }
                placeholder="Instructions for playing your game..."
                rows={3}
                value={formData.instructions}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-700 text-sm dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            onClick={() => navigate("/gaming-dashboard")}
            type="button"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button disabled={loading} type="submit" variant="primary">
            {loading ? "Submitting..." : "Submit Game"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SubmitGame;
