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

  const inputStyle = { padding: '0.3rem 0.5rem', fontSize: '0.8125rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-surface)' };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
      <input
        type="text"
        value={localFilters.search}
        onChange={(e) => handleChange('search', e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search..."
        style={{ ...inputStyle, minWidth: '120px' }}
      />
      <input
        type="text"
        value={localFilters.worker_name}
        onChange={(e) => handleChange('worker_name', e.target.value.toUpperCase())}
        onKeyPress={handleKeyPress}
        placeholder="W"
        maxLength="3"
        style={{ ...inputStyle, width: '48px', textTransform: 'uppercase' }}
      />
      <input
        type="datetime-local"
        value={localFilters.start_date}
        onChange={(e) => handleChange('start_date', e.target.value)}
        onKeyPress={handleKeyPress}
        style={{ ...inputStyle, minWidth: '150px' }}
      />
      <input
        type="datetime-local"
        value={localFilters.end_date}
        onChange={(e) => handleChange('end_date', e.target.value)}
        onKeyPress={handleKeyPress}
        style={{ ...inputStyle, minWidth: '150px' }}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)' }} title="Archived">
        <input
          type="checkbox"
          checked={localFilters.archived}
          onChange={(e) => {
            handleChange('archived', e.target.checked);
            onToggleArchived();
          }}
        />
        Arch
      </label>
      <button onClick={handleApply} className="btn btn-header" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} title="Apply">✓</button>
      <button onClick={handleReset} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} title="Reset">✕</button>
    </div>
  );
}

export default Filters;

