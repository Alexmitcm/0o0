import { useEffect, useId, useState } from "react";

interface CaptchaRecord {
  id: string;
  address: string;
  createdAt: string;
  isActive: boolean;
}

interface CaptchaSettingsPageProps {
  className?: string;
}

const CaptchaSettingsPage = ({ className = "" }: CaptchaSettingsPageProps) => {
  const [captchaRecords, setCaptchaRecords] = useState<CaptchaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockRecords: CaptchaRecord[] = [
      {
        address: "0x1234567890123456789012345678901234567890",
        createdAt: "2025-01-01T00:00:00Z",
        id: "1",
        isActive: true
      },
      {
        address: "0x2345678901234567890123456789012345678901",
        createdAt: "2025-01-02T00:00:00Z",
        id: "2",
        isActive: false
      }
    ];

    setCaptchaRecords(mockRecords);
    setLoading(false);
  }, []);

  const handleDeleteRecord = async (recordId: string) => {
    try {
      // Implement delete API call
      setCaptchaRecords((prev) =>
        prev.filter((record) => record.id !== recordId)
      );
    } catch (err) {
      console.error("Error deleting captcha record:", err);
    }
  };

  const handleToggleActive = async (recordId: string) => {
    try {
      // Implement toggle API call
      setCaptchaRecords((prev) =>
        prev.map((record) =>
          record.id === recordId
            ? { ...record, isActive: !record.isActive }
            : record
        )
      );
    } catch (err) {
      console.error("Error toggling captcha record:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${className}`}>
        <div className="h-12 w-12 animate-spin rounded-full border-blue-500 border-b-2" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-white">Captcha Settings</h2>
        <button
          className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          Add Captcha Record
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {captchaRecords.map((record) => (
                <tr className="hover:bg-gray-50" key={record.id}>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-900 text-sm">
                    {formatAddress(record.address)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                        record.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {record.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                    {formatDate(record.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-sm">
                    <div className="flex space-x-2">
                      <button
                        className={`${
                          record.isActive
                            ? "text-red-600 hover:text-red-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                        onClick={() => handleToggleActive(record.id)}
                        type="button"
                      >
                        {record.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteRecord(record.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateCaptchaRecordModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newRecord) => {
            setCaptchaRecords((prev) => [...prev, newRecord]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Create Captcha Record Modal Component
interface CreateCaptchaRecordModalProps {
  onClose: () => void;
  onSuccess: (record: CaptchaRecord) => void;
}

const CreateCaptchaRecordModal = ({
  onClose,
  onSuccess
}: CreateCaptchaRecordModalProps) => {
  const addressId = useId();
  const [address, setAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Implement create API call
      const newRecord: CaptchaRecord = {
        address,
        createdAt: new Date().toISOString(),
        id: Date.now().toString(),
        isActive: true
      };
      onSuccess(newRecord);
    } catch (err) {
      console.error("Error creating captcha record:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
        <div className="mt-3">
          <h3 className="mb-4 font-medium text-gray-900 text-lg">
            Add Captcha Record
          </h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor={addressId}
              >
                Wallet Address
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                id={addressId}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                required
                type="text"
                value={address}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="submit"
              >
                Add Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CaptchaSettingsPage;
