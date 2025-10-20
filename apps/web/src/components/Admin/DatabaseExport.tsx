import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface DatabaseExportProps {
  className?: string;
}

interface ExportStatus {
  status: "idle" | "exporting" | "success" | "error";
  message?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: string;
}

const DatabaseExport = ({ className = "" }: DatabaseExportProps) => {
  const [exportStatus, setExportStatus] = useState<ExportStatus>({
    status: "idle"
  });
  const [exportType, setExportType] = useState<
    "full" | "users" | "transactions"
  >("full");
  const [includeArchives, setIncludeArchives] = useState(true);

  const handleExport = async () => {
    try {
      setExportStatus({
        message: "در حال آماده‌سازی فایل export...",
        status: "exporting"
      });

      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      const baseApi =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(`${baseApi}/admin/export-database`, {
        body: JSON.stringify({
          includeArchives,
          timestamp: new Date().toISOString(),
          type: exportType
        }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const fileName = `database-export-${exportType}-${timestamp}.json`;

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportStatus({
        fileName,
        fileSize: formatFileSize(blob.size),
        message: "فایل export با موفقیت دانلود شد",
        status: "success"
      });
    } catch (error) {
      console.error("Export error:", error);
      setExportStatus({
        message: `خطا در export: ${error instanceof Error ? error.message : "خطای نامشخص"}`,
        status: "error"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = () => {
    switch (exportStatus.status) {
      case "exporting":
        return <ClockIcon className="h-5 w-5 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "error":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentArrowDownIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (exportStatus.status) {
      case "exporting":
        return "border-blue-200 bg-blue-50 text-blue-800";
      case "success":
        return "border-green-200 bg-green-50 text-green-800";
      case "error":
        return "border-red-200 bg-red-50 text-red-800";
      default:
        return "border-gray-200 bg-gray-50 text-gray-800";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="mb-2 font-bold text-2xl text-white">Database Export</h2>
        <p className="text-gray-400">
          دانلود آخرین نسخه از دیتابیس برای backup یا migration
        </p>
      </div>

      {/* Export Options */}
      <div className="space-y-6 rounded-lg bg-gray-800 p-6">
        <h3 className="mb-4 font-semibold text-lg text-white">
          تنظیمات Export
        </h3>

        {/* Export Type */}
        <div>
          <label className="mb-3 block font-medium text-gray-300 text-sm">
            نوع Export
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                checked={exportType === "full"}
                className="mr-3 text-blue-600"
                name="exportType"
                onChange={(e) => setExportType(e.target.value as "full")}
                type="radio"
                value="full"
              />
              <span className="text-gray-300">Full Database (همه جداول)</span>
            </label>
            <label className="flex items-center">
              <input
                checked={exportType === "users"}
                className="mr-3 text-blue-600"
                name="exportType"
                onChange={(e) => setExportType(e.target.value as "users")}
                type="radio"
                value="users"
              />
              <span className="text-gray-300">Users Only (فقط کاربران)</span>
            </label>
            <label className="flex items-center">
              <input
                checked={exportType === "transactions"}
                className="mr-3 text-blue-600"
                name="exportType"
                onChange={(e) =>
                  setExportType(e.target.value as "transactions")
                }
                type="radio"
                value="transactions"
              />
              <span className="text-gray-300">
                Transactions Only (فقط تراکنش‌ها)
              </span>
            </label>
          </div>
        </div>

        {/* Include Archives */}
        <div>
          <label className="flex items-center">
            <input
              checked={includeArchives}
              className="mr-3 text-blue-600"
              onChange={(e) => setIncludeArchives(e.target.checked)}
              type="checkbox"
            />
            <span className="text-gray-300">
              شامل آرشیو کاربران (Users Archive)
            </span>
          </label>
        </div>

        {/* Export Button */}
        <div className="pt-4">
          <button
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
            disabled={exportStatus.status === "exporting"}
            onClick={handleExport}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            {exportStatus.status === "exporting"
              ? "در حال Export..."
              : "Export Database"}
          </button>
        </div>
      </div>

      {/* Status Display */}
      {exportStatus.status !== "idle" && (
        <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{exportStatus.message}</p>
              {exportStatus.fileName && (
                <p className="text-sm opacity-75">
                  فایل: {exportStatus.fileName}
                </p>
              )}
              {exportStatus.fileSize && (
                <p className="text-sm opacity-75">
                  حجم: {exportStatus.fileSize}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-900/20 p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-yellow-500" />
          <div>
            <h4 className="mb-2 font-medium text-yellow-200">نکات مهم:</h4>
            <ul className="space-y-1 text-sm text-yellow-100">
              <li>• فایل export شامل تمام داده‌های فعلی دیتابیس است</li>
              <li>
                • این فایل حاوی اطلاعات حساس است و باید محفوظ نگه داشته شود
              </li>
              <li>
                • برای restore کردن، از ابزارهای مخصوص Prisma استفاده کنید
              </li>
              <li>• Export ممکن است چند دقیقه طول بکشد</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseExport;
