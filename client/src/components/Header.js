import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchPublicConfig } from '../services/configApi';

function Header() {
  const location = useLocation();
  // Initialize from localStorage immediately to avoid flash of default color
  const [pageName, setPageName] = useState(() => {
    return localStorage.getItem('page_name') || 'Shift Handover Log';
  });
  const [headerColor, setHeaderColor] = useState(() => {
    return localStorage.getItem('header_color') || '#2563eb';
  });
  const [logoType, setLogoType] = useState(() => {
    return localStorage.getItem('header_logo_type') || 'none';
  });
  const [logoImage, setLogoImage] = useState(() => {
    return localStorage.getItem('header_logo_image') || '';
  });
  const [logoEmoji, setLogoEmoji] = useState(() => {
    return localStorage.getItem('header_logo_emoji') || '';
  });
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Ensure header color is loaded from localStorage when location changes
  useEffect(() => {
    const savedColor = localStorage.getItem('header_color') || '#2563eb';
    if (savedColor !== headerColor) {
      setHeaderColor(savedColor);
    }
  }, [location.pathname]); // Only depend on location, not headerColor to avoid loops

  useEffect(() => {
    // Update every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Load config from API (only once on mount)
    const loadConfig = async () => {
      try {
        const config = await fetchPublicConfig();
        if (config) {
          // Only update if value changed to avoid unnecessary re-renders
          if (config.page_name) {
            const currentPageName = localStorage.getItem('page_name');
            if (currentPageName !== config.page_name) {
              setPageName(config.page_name);
              localStorage.setItem('page_name', config.page_name);
            }
          }
          if (config.header_color) {
            const currentColor = localStorage.getItem('header_color');
            // Always update if different, even if it's the same as current state
            // This ensures the header color is correct after page navigation
            if (currentColor !== config.header_color || headerColor !== config.header_color) {
              setHeaderColor(config.header_color);
              localStorage.setItem('header_color', config.header_color);
            }
          } else {
            // If API doesn't return header_color, ensure we keep the localStorage value
            const savedColor = localStorage.getItem('header_color');
            if (savedColor && savedColor !== headerColor) {
              setHeaderColor(savedColor);
            }
          }
          if (config.header_logo_type) {
            const currentLogoType = localStorage.getItem('header_logo_type');
            if (currentLogoType !== config.header_logo_type) {
              setLogoType(config.header_logo_type);
              localStorage.setItem('header_logo_type', config.header_logo_type);
            }
          }
          if (config.header_logo_image) {
            const currentLogoImage = localStorage.getItem('header_logo_image');
            if (currentLogoImage !== config.header_logo_image) {
              setLogoImage(config.header_logo_image);
              localStorage.setItem('header_logo_image', config.header_logo_image);
            }
          }
          if (config.header_logo_emoji) {
            const currentLogoEmoji = localStorage.getItem('header_logo_emoji');
            if (currentLogoEmoji !== config.header_logo_emoji) {
              setLogoEmoji(config.header_logo_emoji);
              localStorage.setItem('header_logo_emoji', config.header_logo_emoji);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        // Fallback to localStorage
        const savedPageName = localStorage.getItem('page_name');
        if (savedPageName) setPageName(savedPageName);
        const savedColor = localStorage.getItem('header_color');
        if (savedColor) setHeaderColor(savedColor);
        const savedLogoType = localStorage.getItem('header_logo_type');
        if (savedLogoType) setLogoType(savedLogoType);
        const savedLogoImage = localStorage.getItem('header_logo_image');
        if (savedLogoImage) setLogoImage(savedLogoImage);
        const savedLogoEmoji = localStorage.getItem('header_logo_emoji');
        if (savedLogoEmoji) setLogoEmoji(savedLogoEmoji);
      }
    };

    loadConfig();

    // Cleanup interval on unmount
    return () => clearInterval(timer);
  }, []);

    // Listen for config changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only handle specific keys to avoid unnecessary updates
      if (e.key === 'page_name') {
        const savedPageName = localStorage.getItem('page_name');
        if (savedPageName && savedPageName !== pageName) {
          setPageName(savedPageName);
        }
      } else if (e.key === 'header_color') {
        const savedColor = localStorage.getItem('header_color');
        if (savedColor && savedColor !== headerColor) {
          setHeaderColor(savedColor);
        }
      } else if (e.key === 'header_logo_type') {
        const savedLogoType = localStorage.getItem('header_logo_type');
        if (savedLogoType && savedLogoType !== logoType) {
          setLogoType(savedLogoType);
        }
      } else if (e.key === 'header_logo_image') {
        const savedLogoImage = localStorage.getItem('header_logo_image');
        if (savedLogoImage !== logoImage) {
          setLogoImage(savedLogoImage || '');
        }
      } else if (e.key === 'header_logo_emoji') {
        const savedLogoEmoji = localStorage.getItem('header_logo_emoji');
        if (savedLogoEmoji !== logoEmoji) {
          setLogoEmoji(savedLogoEmoji || '');
        }
      }
    };

    const handleCustomUpdate = () => {
      // Just reload from localStorage, don't fetch from API to avoid infinite loops
      const savedPageName = localStorage.getItem('page_name');
      if (savedPageName) {
        setPageName(savedPageName);
      }
      
      const savedColor = localStorage.getItem('header_color');
      if (savedColor) {
        setHeaderColor(savedColor);
      } else {
        // If no saved color, use default
        setHeaderColor('#2563eb');
      }
      
      const savedLogoType = localStorage.getItem('header_logo_type');
      if (savedLogoType) {
        setLogoType(savedLogoType);
      } else {
        setLogoType('none');
      }
      
      const savedLogoImage = localStorage.getItem('header_logo_image');
      if (savedLogoImage) {
        setLogoImage(savedLogoImage);
      } else {
        setLogoImage('');
      }
      
      const savedLogoEmoji = localStorage.getItem('header_logo_emoji');
      if (savedLogoEmoji) {
        setLogoEmoji(savedLogoEmoji);
      } else {
        setLogoEmoji('');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pageNameUpdated', handleCustomUpdate);
    window.addEventListener('headerColorUpdated', handleCustomUpdate);
    window.addEventListener('headerLogoUpdated', handleCustomUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pageNameUpdated', handleCustomUpdate);
      window.removeEventListener('headerColorUpdated', handleCustomUpdate);
      window.removeEventListener('headerLogoUpdated', handleCustomUpdate);
    };
  }, [pageName, headerColor, logoType, logoImage, logoEmoji]);

  const formattedDateTime = currentDateTime.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Helper to determine if text should be white or black based on background color
  const getTextColor = (hexColor) => {
    // Remove hash if present
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Calculate luminance
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? 'text-gray-900' : 'text-white';
  };

  const textColorClass = getTextColor(headerColor);

  return (
    <header 
      className={`shadow-lg transition-colors duration-200 ${textColorClass}`}
      style={{ backgroundColor: headerColor }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4">
            {logoType === 'image' && logoImage && (
              <img
                src={logoImage.startsWith('http') || logoImage.startsWith('/') 
                  ? logoImage 
                  : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8500'}${logoImage}`}
                alt="Logo"
                className="h-8 md:h-10 w-auto"
                style={{ maxHeight: '2.5rem' }}
              />
            )}
            {logoType === 'emoji' && logoEmoji && (
              <span className="text-2xl md:text-3xl">{logoEmoji}</span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-0">
              {pageName}
            </h1>
            {location.pathname !== '/backoffice' && (
              <Link
                to="/backoffice"
                className="text-sm underline hover:no-underline opacity-80 hover:opacity-100"
                title="Admin Settings (Login Required)"
              >
                ⚙️ Admin
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm md:text-base font-mono">
              {formattedDateTime}
            </div>
            {location.pathname === '/backoffice' && (
              <Link
                to="/"
                className="text-sm underline hover:no-underline opacity-80 hover:opacity-100"
              >
                ← Back to Logs
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

