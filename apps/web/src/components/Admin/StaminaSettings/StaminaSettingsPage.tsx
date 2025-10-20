import { useEffect, useId, useState } from "react";

interface StaminaRecord {
  id: string;
  minEq: number;
  maxEq: number;
  levelValue: number;
  createdAt: string;
}

interface StaminaSettingsPageProps {
  className?: string;
}

const StaminaSettingsPage = ({ className = "" }: StaminaSettingsPageProps) => {
  const [staminaRecords, setStaminaRecords] = useState<StaminaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchStaminaRecords = async () => {
      try {
        // Use the EQ Levels API
        const response = await fetch("/api/eq-levels-new");
        if (response.ok) {
          const data = await response.json();
          setStaminaRecords(data.records || []);
        }
      } catch (err) {
        setError("Failed to fetch stamina records");
        console.error("Error fetching stamina records:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaminaRecords();
  }, []);

  const handleDeleteRecord = async (recordId: string) => {
    try {
      // Implement delete API call
      setStaminaRecords((prev) =>
        prev.filter((record) => record.id !== recordId)
      );
    } catch (err) {
      console.error("Error deleting stamina record:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${className}`}>
        <div className="h-12 w-12 animate-spin rounded-full border-blue-500 border-b-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center text-red-500 ${className}`}>
        Error loading stamina records: {error}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-white">Stamina Settings</h2>
        <button
          className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setShowCreateModal(true)}
          type="button"
        >
          Add Stamina Level
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Min EQ
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Max EQ
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Level Value
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
              {staminaRecords.map((record) => (
                <tr className="hover:bg-gray-50" key={record.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
                    {record.minEq}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
                    {record.maxEq}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
                    {record.levelValue}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                    {formatDate(record.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-sm">
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteRecord(record.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateStaminaRecordModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newRecord) => {
            setStaminaRecords((prev) => [...prev, newRecord]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Create Stamina Record Modal Component
interface CreateStaminaRecordModalProps {
  onClose: () => void;
  onSuccess: (record: StaminaRecord) => void;
}

const CreateStaminaRecordModal = ({
  onClose,
  onSuccess
}: CreateStaminaRecordModalProps) => {
  const minEqId = useId();
  const maxEqId = useId();
  const levelValueId = useId();

  const [formData, setFormData] = useState({
    levelValue: 0,
    maxEq: 0,
    minEq: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Implement create API call
      const newRecord: StaminaRecord = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      onSuccess(newRecord);
    } catch (err) {
      console.error("Error creating stamina record:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
        <div className="mt-3">
          <h3 className="mb-4 font-medium text-gray-900 text-lg">
            Add Stamina Level
          </h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor={minEqId}
              >
                Min EQ
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                id={minEqId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minEq: Number.parseInt(e.target.value)
                  })
                }
                placeholder="Enter minimum EQ value"
                required
                type="number"
                value={formData.minEq}
              />
            </div>
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor={maxEqId}
              >
                Max EQ
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                id={maxEqId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxEq: Number.parseInt(e.target.value)
                  })
                }
                placeholder="Enter maximum EQ value"
                required
                type="number"
                value={formData.maxEq}
              />
            </div>
            <div>
              <label
                className="block font-medium text-gray-700 text-sm"
                htmlFor={levelValueId}
              >
                Level Value
              </label>
              <input
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                id={levelValueId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    levelValue: Number.parseInt(e.target.value)
                  })
                }
                placeholder="Enter level value"
                required
                type="number"
                value={formData.levelValue}
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
                Add Level
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaminaSettingsPage;
