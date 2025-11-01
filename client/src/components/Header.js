import React from 'react';

function Header() {
  const currentDateTime = new Date().toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-0">
            Shift Handover Log
          </h1>
          <div className="text-sm md:text-base">
            {currentDateTime}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

