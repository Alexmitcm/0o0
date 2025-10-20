import { Dialog, Transition } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";

interface Profile {
  id: string;
  handle: string;
  ownedBy: string;
  isDefault: boolean;
}

interface ProfileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  onProfileSelect: (profileId: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ProfileSelectionModal({
  isOpen,
  onClose,
  profiles,
  onProfileSelect,
  isLoading = false
}: ProfileSelectionModalProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfileSelect = async () => {
    if (!selectedProfileId) return;

    setIsSubmitting(true);
    try {
      await onProfileSelect(selectedProfileId);
      onClose();
    } catch (error) {
      console.error("Failed to link profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Transition appear as={Fragment} show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="font-medium text-gray-900 text-lg leading-6"
                  >
                    Choose Your Permanent Premium Profile
                  </Dialog.Title>
                  <button
                    className="rounded-full p-1 hover:bg-gray-100 disabled:opacity-50"
                    disabled={isSubmitting}
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-start space-x-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    <div className="text-amber-800 text-sm">
                      <p className="mb-1 font-medium">One-time action</p>
                      <p>
                        Your wallet is already registered as a premium member.
                        Please choose one of your Lens profiles to link
                        permanently.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="mb-3 text-gray-600 text-sm">
                    Select the profile you want to link permanently:
                  </p>

                  <div className="space-y-2">
                    {profiles.map((profile) => (
                      <label
                        className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                          selectedProfileId === profile.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        key={profile.id}
                      >
                        <input
                          checked={selectedProfileId === profile.id}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={isSubmitting}
                          name="profile"
                          onChange={(e) => setSelectedProfileId(e.target.value)}
                          type="radio"
                          value={profile.id}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 text-sm">
                              @{profile.handle}
                            </span>
                            {profile.isDefault && (
                              <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-800 text-xs">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-gray-500 text-xs">
                            {profile.ownedBy.slice(0, 6)}...
                            {profile.ownedBy.slice(-4)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmitting}
                    onClick={handleClose}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedProfileId || isSubmitting}
                    onClick={handleProfileSelect}
                    type="button"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                        Linking...
                      </div>
                    ) : (
                      "Link This Profile Permanently"
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
