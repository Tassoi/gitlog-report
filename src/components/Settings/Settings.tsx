const Settings = () => {
  return (
    <div className="settings p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">LLM Configuration</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configuration UI will be implemented in M2+
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Export Options</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Export format selection will be implemented in M2+
        </p>
      </div>
    </div>
  );
};

export default Settings;
