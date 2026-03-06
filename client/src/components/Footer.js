import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
        <div className="text-center" style={{ fontSize: '0.875rem' }}>
          <p>
            <span style={{ fontWeight: 600 }}>Shift Handover Log</span> v0.26.03-Alpha.3
          </p>
          <p style={{ marginTop: '0.25rem' }}>
            Author: <span style={{ fontWeight: 500 }}>Miguel da Silva</span>
          </p>
          <p style={{ marginTop: '0.25rem' }}>
            License: <span style={{ fontWeight: 500 }}>ISC</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

