import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useSearchParams } from "react-router-dom";

interface StatusOverride {
  status?: "success" | "error" | "info";
  message?: string;
}

const StatusBanner = ({
  status: overrideStatus,
  message: overrideMessage
}: StatusOverride) => {
  const [params, setParams] = useSearchParams();
  const statusParam = (overrideStatus || (params.get("status") as any)) as
    | "success"
    | "error"
    | "info"
    | "deleted"
    | undefined;
  const messageParam = overrideMessage || params.get("message") || undefined;

  let visible = Boolean(statusParam);
  let tone: "success" | "error" | "info" = "info";
  let message = messageParam;

  if (statusParam === "deleted") {
    visible = true;
    tone = "success";
    message = message || "Game deleted successfully";
  } else if (statusParam === "success") {
    tone = "success";
  } else if (statusParam === "error") {
    tone = "error";
  } else if (statusParam === "info") {
    tone = "info";
  }

  if (!visible) return null;

  const styles =
    tone === "success"
      ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800"
      : tone === "error"
        ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800"
        : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800";

  const Icon =
    tone === "success"
      ? CheckCircleIcon
      : tone === "error"
        ? ExclamationTriangleIcon
        : CheckCircleIcon;

  const handleDismiss = () => {
    const next = new URLSearchParams(params);
    next.delete("status");
    next.delete("message");
    setParams(next, { replace: true });
  };

  return (
    <div
      className={`mb-4 flex items-center justify-between rounded-md border px-4 py-3 ${styles}`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="font-medium text-sm">
          {message ||
            (tone === "success"
              ? "Success"
              : tone === "error"
                ? "Error"
                : "Info")}
        </span>
      </div>
      <button
        aria-label="Dismiss alert"
        className="rounded p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:hover:bg-white/10"
        onClick={handleDismiss}
        onKeyDown={(e) => e.key === "Enter" && handleDismiss()}
        tabIndex={0}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default StatusBanner;
