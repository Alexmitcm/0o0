import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface FilterPanelProps {
  walletFilter: string;
  onFilterChange: (filter: string) => void;
  onClearFilter: () => void;
  isSearching?: boolean;
  searchResults?: number;
  hasResults?: boolean;
}

const FilterPanel = ({
  walletFilter,
  onFilterChange,
  onClearFilter,
  isSearching = false,
  searchResults = 0,
  hasResults = true
}: FilterPanelProps) => {
  const getSearchStatus = () => {
    if (isSearching) return "Searching...";
    if (!walletFilter) return "";
    if (hasResults)
      return `Found ${searchResults} matching node${searchResults !== 1 ? "s" : ""}`;
    return "No matching nodes found";
  };

  const getStatusColor = () => {
    if (isSearching) return "text-blue-600";
    if (!walletFilter) return "text-gray-500";
    if (hasResults) return "text-green-600";
    return "text-red-600";
  };

  const getStatusDot = () => {
    if (isSearching) return "bg-blue-500 animate-pulse";
    if (!walletFilter) return "bg-gray-400";
    if (hasResults) return "bg-green-500";
    return "bg-red-500";
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
        <h2 className="font-semibold text-gray-900 text-lg">Filter</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            className="mb-2 block font-medium text-gray-700 text-sm"
            htmlFor="wallet-filter"
          >
            Wallet Address
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
            <input
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              id="wallet-filter"
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Search by address..."
              type="text"
              value={walletFilter}
            />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <button
            className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            disabled={!walletFilter || isSearching}
            onClick={() => onFilterChange(walletFilter)}
            type="button"
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Search
              </div>
            ) : (
              "Search"
            )}
          </button>
          <button
            className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-200"
            onClick={onClearFilter}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search Status */}
      {walletFilter && (
        <div className="mt-3 flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${getStatusDot()}`} />
          <span className={`text-sm ${getStatusColor()}`}>
            {getSearchStatus()}
          </span>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
