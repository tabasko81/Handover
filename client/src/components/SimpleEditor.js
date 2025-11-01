import React, { useRef, useEffect } from 'react';

function SimpleEditor({ value, onChange, maxLength = 1000 }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== value) {
      editorRef.current.innerText = value || '';
    }
  }, [value]);

  const handleInput = (e) => {
    const text = e.target.innerText;
    if (text.length <= maxLength) {
      onChange(text);
    } else {
      e.target.innerText = text.substring(0, maxLength);
      onChange(text.substring(0, maxLength));
    }
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 p-2 border border-gray-300 rounded-md bg-gray-50">
        <button
          type="button"
          onClick={() => applyFormat('bold')}
          className="px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-200"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          className="px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-200"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => applyFormat('underline')}
          className="px-3 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-200"
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => applyFormat('insertUnorderedList')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => applyFormat('insertOrderedList')}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
          title="Numbered List"
        >
          1. List
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word'
        }}
      />
      <div className="text-sm text-gray-500 mt-1 text-right">
        {value.length}/{maxLength} characters
      </div>
    </div>
  );
}

export default SimpleEditor;

