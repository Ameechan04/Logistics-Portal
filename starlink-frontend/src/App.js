import React, { useState } from 'react';
import './Styles/App.css';
import Navigation from './Navigation';
import Homepage from './Homepage';
import ShipmentsPage from './ShipmentsPage';
// Import the new pages
import PriorityDistributionPage from './PriorityDistributionPage';
import WeightCostPage from './WeightCostPage';

const API_BASE_URL = 'http://localhost:5000/api';


function App() {
  // The currentPage state now has more possible values.
  const [currentPage, setCurrentPage] = useState('homepage');

  // Renders the correct page based on the `currentPage` state.
  const renderPage = () => {
    switch (currentPage) {
      case 'homepage':
        return <Homepage />;
      case 'shipments':
        return <ShipmentsPage apiBaseUrl={API_BASE_URL} />;
      case 'priority':
        // Render the PriorityDistributionPage
        return <PriorityDistributionPage apiBaseUrl={API_BASE_URL} />;
      case 'weightcost':
        // Render the WeightCostPage
        return <WeightCostPage apiBaseUrl={API_BASE_URL} />;
      default:
        // Fallback to the homepage if the state is unexpected
        return <Homepage />;
    }
  };

  return (
      <div>
        <header>
          <h1 className="titleText">Starlinks Global Logistics Portal</h1>
          <p className="welcomeText">Welcome to the Starlinks Global Logistics Portal Dashboard</p>

        <Navigation setCurrentPage={setCurrentPage} />
        </header>

        <main className="mt-8">
          {renderPage()}
        </main>
      </div>
  );
}

export default App;
