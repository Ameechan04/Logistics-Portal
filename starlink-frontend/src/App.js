import React, { useState } from 'react';
import './Styles/App.css';
import Navigation from './Navigation';
import Homepage from './Homepage';
import ShipmentsPage from './ShipmentsPage';
import PriorityDistributionPage from './PriorityDistributionPage';
import WeightCostPage from './WeightCostPage';

const API_BASE_URL = 'http://localhost:5000/api';


function App() {
  const [currentPage, setCurrentPage] = useState('homepage');

  const renderPage = () => {
    switch (currentPage) {
      case 'homepage':
        return <Homepage />;
      case 'shipments':
        return <ShipmentsPage apiBaseUrl={API_BASE_URL} />;
      case 'priority':
        return <PriorityDistributionPage apiBaseUrl={API_BASE_URL} />;
      case 'weightcost':
        return <WeightCostPage apiBaseUrl={API_BASE_URL} />;
      default:
        return <Homepage />;
    }
  };

  return (
      <div>
        <header>
          <h1 className="titleText">Starlinks Global Logistics Portal</h1>
          <p className="welcomeText">Welcome to the Starlinks Global Logistics Portal Dashboard</p>

        <Navigation setCurrentPage={setCurrentPage} currentPage={currentPage} />
        </header>

        <main className="mt-8">
          {renderPage()}
        </main>
      </div>
  );
}

export default App;
