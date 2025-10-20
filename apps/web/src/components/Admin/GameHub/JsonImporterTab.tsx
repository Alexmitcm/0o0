const JsonImporterTab = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
        <h3 className="font-medium text-lg text-purple-900 dark:text-purple-100">
          JSON Importer
        </h3>
        <p className="mt-2 text-purple-800 text-sm dark:text-purple-200">
          Bulk import games using JSON format. This is useful for importing
          large numbers of games at once.
        </p>
      </div>

      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          JSON Importer functionality coming soon...
        </p>
      </div>
    </div>
  );
};

export default JsonImporterTab;
