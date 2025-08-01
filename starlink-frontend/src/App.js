// frontend/src/App.js

import React, { useState } from 'react';
import './Styles/App.css';
import Navigation from './Navigation';
import Homepage from './Homepage'; // Corrected import
import ShipmentsPage from './ShipmentsPage';

const API_BASE_URL = 'http://localhost:5000/api';


function App() {
  // State for managing the current page. We now only have 'homepage' and 'shipments'.
  const [currentPage, setCurrentPage] = useState('homepage');

  // render current page based on `currentPage` state
  const renderPage = () => {
    switch (currentPage) {
      case 'homepage':
        // The Homepage component is now self-contained and fetches its own data
        return <Homepage />;
      case 'shipments':
        // ShipmentsPage still needs the API base URL for its filters
        return <ShipmentsPage apiBaseUrl={API_BASE_URL} />;
      default:
        // Fallback to the homepage
        return <Homepage />;
    }
  };

  return (
      <div>
        <header>
          <h1 className="titleText">Starlinks Global Logistics Portal</h1>
          <p className="welcomeText">Welcome to the Starlinks Global Logistics Portal Dashboard</p>

        {/* Navigation component */}
        <Navigation setCurrentPage={setCurrentPage} />
        </header>

        {/* Render selected page */}
        <main className="mt-8">
          {renderPage()}
        </main>
      </div>
  );
}

export default App;
