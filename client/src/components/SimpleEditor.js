import React from 'react';

function SimpleEditor({ value, onChange, maxLength = 1000 }) {
  const handleInput = (e) => {
    const text = e.target.value || '';
    
    if (text.length <= maxLength) {
      // Update parent component with plain text
      onChange(text);
    } else {
      // Truncate
      const truncated = text.substring(0, maxLength);
      e.target.value = truncated;
      onChange(truncated);
    }
  };

  return (
    <div>
      <textarea
        value={value || ''}
        onChange={handleInput}
        className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        placeholder="Type your note here. Press Enter for new lines.

Use @user or @all to mention someone."
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          resize: 'vertical'
        }}
      />
      <div className="text-sm text-gray-500 mt-1 text-right">
        {value.length}/{maxLength} characters
      </div>
    </div>
  );
}

export default SimpleEditor;
