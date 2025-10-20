const FetchGamesTab = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <h3 className="font-medium text-lg text-yellow-900 dark:text-yellow-100">
          Fetch Games from External Distributors
        </h3>
        <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-200">
          This feature allows you to fetch games from external distributors like
          GameDistribution and GamePix. You need to join their publisher
          programs to use this feature.
        </p>
      </div>

      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Fetch Games functionality coming soon...
        </p>
      </div>
    </div>
  );
};

export default FetchGamesTab;
