import React, { useState } from 'react';

function MarkdownGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
      >
        <span>Markdown Guide</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs">
          <div className="space-y-2">
            <div>
              <strong>**Bold**</strong> ou <strong>__Bold__</strong>
            </div>
            <div>
              <em>*Italic*</em> ou <em>_Italic_</em>
            </div>
            <div>
              <strong><em>***Bold Italic***</em></strong>
            </div>
            <div>
              # Heading 1<br />
              ## Heading 2<br />
              ### Heading 3
            </div>
            <div>
              • List item<br />
              • Another item
            </div>
            <div>
              1. Numbered list<br />
              2. Second item
            </div>
            <div>
              [Link text](https://example.com)
            </div>
            <div>
              `Code` ou ```Code block```
            </div>
            <div>
              @mention (já suportado)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarkdownGuide;

