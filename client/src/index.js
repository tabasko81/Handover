import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Backoffice from './pages/Backoffice';

// Init Daynight theme (light/dark) - sync body with html
const savedTheme = localStorage.getItem('daynight-theme');
if (savedTheme === 'carbon') {
  document.body.classList.add('carbon');
} else {
  document.body.classList.remove('carbon');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/backoffice" element={<Backoffice />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
