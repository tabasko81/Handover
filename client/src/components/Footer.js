import React from 'react';

function Footer() {
  return (
    <footer className="mt-8 py-4 border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-gray-600">
          <p>
            <span className="font-semibold">Shift Handover Log</span> v0.25.12-Alpha.7
          </p>
          <p className="mt-1">
            Author: <span className="font-medium">Miguel da Silva</span>
          </p>
          <p className="mt-1">
            License: <span className="font-medium">ISC</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

