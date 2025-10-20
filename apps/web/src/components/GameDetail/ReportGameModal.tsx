import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { reportGame } from "@/helpers/gameHub";

interface ReportGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  gameSlug: string;
}

const ReportGameModal = ({
  isOpen,
  onClose,
  gameTitle,
  gameSlug
}: ReportGameModalProps) => {
  const [reason, setReason] = useState<"Bug" | "Error" | "Other">("Bug");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await reportGame(gameSlug, { description, reason });
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
        setReason("Bug");
        setDescription("");
      }, 2000);
    } catch (error) {
      console.error("Failed to report game:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog className="relative z-50" onClose={onClose} open={isOpen}>
      <div aria-hidden="true" className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-semibold text-gray-900 text-lg">
              Report Game
            </Dialog.Title>
            <button
              className="rounded-full p-1 text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {submitSuccess ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
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
              <p className="font-medium text-green-600">
                Report submitted successfully!
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block font-medium text-gray-700 text-sm">
                  Reason for Report
                </label>
                <div className="space-y-2">
                  {(["Bug", "Error", "Other"] as const).map((option) => (
                    <label className="flex items-center" key={option}>
                      <input
                        checked={reason === option}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        name="reason"
                        onChange={(e) =>
                          setReason(e.target.value as typeof reason)
                        }
                        type="radio"
                        value={option}
                      />
                      <span className="ml-2 text-gray-700 text-sm">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-gray-700 text-sm"
                  htmlFor="description"
                >
                  Description (Optional)
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  id="description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide additional details about the issue..."
                  rows={3}
                  value={description}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-md bg-red-600 px-4 py-2 font-medium text-sm text-white hover:bg-red-700 disabled:opacity-50"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ReportGameModal;
