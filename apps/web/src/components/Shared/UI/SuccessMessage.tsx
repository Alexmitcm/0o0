import { CheckCircleIcon } from "@heroicons/react/24/solid";
import cn from "@/helpers/cn";

interface SuccessMessageProps {
  message: string;
  description?: string;
  className?: string;
  onClose?: () => void;
}

const SuccessMessage = ({
  message,
  description,
  className = "",
  onClose
}: SuccessMessageProps) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-green-500/50 bg-gradient-to-r from-green-900/30 to-emerald-900/20 p-6 shadow-lg ring-1 ring-green-500/20 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-8 w-8 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-green-300 text-lg">{message}</h3>
          {description && (
            <p className="mt-2 text-green-200 text-sm">{description}</p>
          )}
        </div>
        {onClose && (
          <button
            className="flex-shrink-0 text-green-400 transition-colors hover:text-green-300"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                clipRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                fillRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessMessage;
