import React, { useState, useEffect } from 'react';
import { fetchPublicConfig } from '../services/configApi';
import { parseMarkdown } from '../utils/markdownParser';

function InfoSlide() {
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState('');
  const [headerColor, setHeaderColor] = useState('#2563eb');

  useEffect(() => {
    loadInfo();
    
    const savedColor = localStorage.getItem('header_color');
    if (savedColor) setHeaderColor(savedColor);

    const handleCustomUpdate = () => {
      const savedColor = localStorage.getItem('header_color');
      if (savedColor) setHeaderColor(savedColor);
    };

    window.addEventListener('headerColorUpdated', handleCustomUpdate);
    return () => window.removeEventListener('headerColorUpdated', handleCustomUpdate);
  }, []);

  const loadInfo = async () => {
    try {
      const config = await fetchPublicConfig();
      if (config && config.permanent_info) {
        setInfo(config.permanent_info);
      }
    } catch (error) {
      console.error('Failed to load permanent info:', error);
      // Silently fail - don't break the app if config can't be loaded
      setInfo('');
    }
  };

  const toggleSlide = () => {
    setIsOpen(!isOpen);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Info button (fixed on left side) */}
      <button
        onClick={toggleSlide}
        className={`fixed left-0 top-1/2 transform -translate-y-1/2 z-40 text-white p-3 rounded-r-lg shadow-lg transition-all duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-100'
        }`}
        style={{ backgroundColor: headerColor }}
        title="Permanent Information"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleBackdropClick}
        />
      )}

      {/* Slide panel */}
      <div
        className={`fixed left-0 top-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '400px', maxWidth: '90vw' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div 
            className="text-white p-4 flex justify-between items-center transition-colors duration-200"
            style={{ backgroundColor: headerColor }}
          >
            <h2 className="text-xl font-bold">Permanent Information</h2>
            <button
              onClick={toggleSlide}
              className="text-white hover:text-gray-200 text-2xl"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 text-gray-900">
            {info ? (
              <div
                className="prose max-w-none"
                style={{ 
                  lineHeight: '1.6',
                  wordWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(info)
                }}
              />
            ) : (
              <p className="text-gray-500 italic">No permanent information available.</p>
            )}
          </div>
          
          {/* CSS to ensure proper paragraph spacing - matches WYSIWYG editor */}
          <style>{`
            .prose {
              line-height: 1.6;
            }
            .prose div {
              display: block;
              margin-bottom: 0.75rem;
              margin-top: 0;
            }
            .prose div:first-child {
              margin-top: 0;
            }
            .prose div:last-child {
              margin-bottom: 0;
            }
            .prose p {
              display: block;
              margin-bottom: 0.75rem;
              margin-top: 0;
            }
            .prose p:first-child {
              margin-top: 0;
            }
            .prose p:last-child {
              margin-bottom: 0;
            }
            .prose br {
              line-height: 1.6;
            }
            .prose br + br {
              margin-top: 0.5rem;
            }
          `}</style>
        </div>
      </div>
    </>
  );
}

export default InfoSlide;

