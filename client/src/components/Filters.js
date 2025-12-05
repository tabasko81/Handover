import React, { useState } from 'react';

function Filters({ filters, onFilterChange, onToggleArchived }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      worker_name: '',
      start_date: '',
      end_date: '',
      archived: false
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search in descriptions, notes... (Press Enter to search)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Worker Name
          </label>
          <input
            type="text"
            value={localFilters.worker_name}
            onChange={(e) => handleChange('worker_name', e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="ABC"
            maxLength="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={localFilters.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="datetime-local"
            value={localFilters.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleApply}
          className="px-4 py-2 text-white rounded hover:opacity-90"
          style={{ backgroundColor: 'var(--header-color)' }}
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Reset
        </button>
        <label className="flex items-center px-4 py-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">
          <input
            type="checkbox"
            checked={localFilters.archived}
            onChange={(e) => {
              handleChange('archived', e.target.checked);
              onToggleArchived();
            }}
            className="mr-2"
          />
          Show Archived
        </label>
      </div>
    </div>
  );
}

export default Filters;

