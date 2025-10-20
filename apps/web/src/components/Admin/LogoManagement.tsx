import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import LogoBar from "../Shared/LogoBar";
import { type CompanyLogo, useLogoContext } from "../../contexts/LogoContext";

const LogoManagement = () => {
  const { logos, addLogo, updateLogo, deleteLogo } = useLogoContext();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    logoUrl: "",
    name: "",
    websiteUrl: ""
  });

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({ logoUrl: "", name: "", websiteUrl: "" });
  };

  const handleEdit = (logo: CompanyLogo) => {
    console.log("Editing logo:", logo);
    setEditingId(logo.id);
    setIsAdding(false);
    setFormData({
      logoUrl: logo.logoUrl,
      name: logo.name,
      websiteUrl: logo.websiteUrl || ""
    });
    console.log("Form data set:", {
      logoUrl: logo.logoUrl,
      name: logo.name,
      websiteUrl: logo.websiteUrl || ""
    });
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.logoUrl.trim()) {
      alert("Please fill in company name and logo URL");
      return;
    }

    const newLogo: CompanyLogo = {
      id: editingId || Date.now().toString(),
      logoUrl: formData.logoUrl.trim(),
      name: formData.name.trim(),
      websiteUrl: formData.websiteUrl.trim() || undefined
    };

    if (editingId) {
      updateLogo(editingId, newLogo);
      console.log("Logo updated:", newLogo);
    } else {
      addLogo(newLogo);
      console.log("Logo added:", newLogo);
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({ logoUrl: "", name: "", websiteUrl: "" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this logo?")) {
      deleteLogo(id);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ logoUrl: "", name: "", websiteUrl: "" });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const logoUrl = e.target?.result as string;
      setFormData((prev) => ({ ...prev, logoUrl }));
      console.log(
        "File uploaded:",
        file.name,
        "Base64 URL:",
        `${logoUrl.substring(0, 50)}...`
      );
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-white">
          Company Logos Management
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          onClick={handleAdd}
          type="button"
        >
          <PlusIcon className="h-4 w-4" />
          Add Logo
        </button>
      </div>

      {/* Live Preview */}
      <div>
        <h3 className="mb-4 font-semibold text-lg text-white">Live Preview</h3>
        <div className="rounded-lg border border-gray-600 bg-gray-900 p-4">
          <LogoBar />
        </div>
        <div className="mt-2 text-gray-400 text-xs">
          <p>Total logos: {logos.length}</p>
          <p>Current logos: {logos.map((logo) => logo.name).join(", ")}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h3 className="mb-4 font-semibold text-lg text-white">
            {editingId ? "Edit Logo" : "Add New Logo"}
          </h3>

          <div className="space-y-4">
            <div>
              <label
                className="mb-2 block font-medium text-gray-300 text-sm"
                htmlFor="company-name"
              >
                Company Name *
              </label>
              <input
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-transparent focus:ring-2 focus:ring-blue-500"
                id="company-name"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter company name"
                type="text"
                value={formData.name}
              />
            </div>

            <div>
              <label
                className="mb-2 block font-medium text-gray-300 text-sm"
                htmlFor="logo-url"
              >
                Logo URL *
              </label>
              <input
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-transparent focus:ring-2 focus:ring-blue-500"
                id="logo-url"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    logoUrl: e.target.value
                  }))
                }
                placeholder="https://example.com/logo.png"
                type="url"
                value={formData.logoUrl}
              />
            </div>

            <div>
              <label
                className="mb-2 block font-medium text-gray-300 text-sm"
                htmlFor="logo-file"
              >
                Or Upload Image File
              </label>
              <input
                accept="image/*"
                className="block w-full text-gray-300 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-medium file:text-sm file:text-white hover:file:bg-blue-700"
                id="logo-file"
                onChange={handleFileUpload}
                type="file"
              />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-gray-300 text-sm">Quick Test URLs:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      logoUrl: "https://logo.clearbit.com/google.com"
                    }))
                  }
                  type="button"
                >
                  Google
                </button>
                <button
                  className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      logoUrl: "https://logo.clearbit.com/microsoft.com"
                    }))
                  }
                  type="button"
                >
                  Microsoft
                </button>
                <button
                  className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      logoUrl: "https://logo.clearbit.com/apple.com"
                    }))
                  }
                  type="button"
                >
                  Apple
                </button>
                <button
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      logoUrl: "https://logo.clearbit.com/amazon.com"
                    }))
                  }
                  type="button"
                >
                  Amazon
                </button>
              </div>
            </div>

            {formData.logoUrl && (
              <div className="mt-4">
                <p className="mb-2 text-gray-300 text-sm">Preview:</p>
                <div className="flex h-20 w-20 items-center justify-center rounded border border-gray-600 bg-gray-700">
                  <img
                    alt="Logo preview"
                    className="h-16 w-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const nextElement = e.currentTarget
                        .nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = "block";
                      }
                    }}
                    src={formData.logoUrl}
                  />
                  <span className="hidden text-gray-400 text-xs">
                    ❌ Failed to load
                  </span>
                </div>
                <p className="mt-2 text-gray-400 text-xs">
                  URL:{" "}
                  {formData.logoUrl.length > 50
                    ? `${formData.logoUrl.substring(0, 50)}...`
                    : formData.logoUrl}
                </p>
              </div>
            )}

            <div>
              <label
                className="mb-2 block font-medium text-gray-300 text-sm"
                htmlFor="website-url"
              >
                Website URL (Optional)
              </label>
              <input
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-transparent focus:ring-2 focus:ring-blue-500"
                id="website-url"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    websiteUrl: e.target.value
                  }))
                }
                placeholder="https://company-website.com"
                type="url"
                value={formData.websiteUrl}
              />
            </div>

            <div className="flex gap-3">
              <button
                className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                onClick={handleSave}
                type="button"
              >
                {editingId ? "Update" : "Add"} Logo
              </button>
              <button
                className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logos List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {logos.map((logo) => (
          <div
            className="rounded-lg border border-gray-700 bg-gray-800 p-4"
            key={logo.id}
          >
            <div className="mb-3 flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700">
                <img
                  alt={`${logo.name} logo`}
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      const div = document.createElement('div');
                      div.className = 'text-xs font-bold text-gray-400';
                      div.textContent = logo.name.charAt(0);
                      parent.appendChild(div);
                    }
                  }}
                  src={logo.logoUrl}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">{logo.name}</h4>
                {logo.websiteUrl && (
                  <p className="truncate text-gray-400 text-sm">
                    {logo.websiteUrl}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                onClick={() => handleEdit(logo)}
                type="button"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
              <button
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
                onClick={() => handleDelete(logo.id)}
                type="button"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {logos.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-400">
            No logos added yet. Click "Add Logo" to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default LogoManagement;
