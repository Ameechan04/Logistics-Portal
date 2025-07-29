// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css'; // Ensure this CSS file exists and is linked

// Import new page components
import Navigation from './Navigation';
import HomePage from './Homepage';
import ShipmentsPage from './ShipmentsPage';
import PriorityDistributionPage from './PriorityDistributionPage';
import WeightCostCorrelationPage from './WeightCostPage';

// Base URL for your Flask API
const API_BASE_URL = 'http://localhost:5000/api';

// --- Main App Component ---
function App() {
  // State to manage which page is currently displayed
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'shipments', 'priority', 'weight_cost'

  // --- States for Data (fetched in App.js and passed down) ---
  const [totalShipments, setTotalShipments] = useState(0);
  const [totalDelayedShipments, setTotalDelayedShipments] = useState(null);
  const [avgCostByCarrierData, setAvgCostByCarrierData] = useState([]);
  const [top5ExpensiveShipments, setTop5ExpensiveShipments] = useState([]);
  const [priorityDistributionData, setPriorityDistributionData] = useState([]);
  const [weightCostExpressCorrelation, setWeightCostExpressCorrelation] = useState([]);

  // --- Loading and Error States ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Helper function to process data for the "Average Cost by Carrier" chart ---
  const processAverageCostData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      carrier: item.Carrier,
      averageCost: item.AverageCost
    }));
  };

  // --- Helper function to process data for the "Priority Distribution by Status" chart ---
  const processPriorityDistributionData = (data) => {
    if (!Array.isArray(data)) return [];

    const formattedData = {};
    data.forEach(item => {
      const status = item.DeliveryStatus;
      const priority = item.Priority;
      const count = item.Count;

      if (!formattedData[status]) {
        formattedData[status] = { status: status };
      }
      formattedData[status][priority] = count;
    });

    const result = Object.values(formattedData);

    const statusOrder = ["Delivered", "Delayed", "In Transit", "Cancelled"];
    result.sort((a, b) => {
      const orderA = statusOrder.indexOf(a.status);
      const orderB = statusOrder.indexOf(b.status);
      return orderA - orderB;
    });

    return result;
  };

  // --- Fetch ALL Data for Dashboard Overview & Charts ---
  const fetchAllDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch Total Shipments (for homepage overview)
      const totalShipmentsRes = await axios.get(`${API_BASE_URL}/shipments`);
      setTotalShipments(totalShipmentsRes.data.totalCount); // Assuming this endpoint returns totalCount

      // Fetch Total Delayed Shipments (for homepage overview)
      const delayedRes = await axios.get(`${API_BASE_URL}/total_delayed`);
      setTotalDelayedShipments(delayedRes.data.count);

      // Fetch Average Cost by Carrier (for homepage chart)
      // Fetch Average Cost by Carrier (for homepage chart)
      const avgCostRes = await axios.get(`${API_BASE_URL}/average_shipment_by_carrier`);

      // --- THIS IS THE CRITICAL CHANGE: DECLARE THE VARIABLE ---
      const processedAvgCostData = processAverageCostData(avgCostRes.data);
      // --- END CRITICAL CHANGE ---

      setAvgCostByCarrierData(processedAvgCostData); // Now use the declared variable

      // --- These console.logs will now work ---
      console.log('App.js DEBUG: Raw avgCostRes.data:', avgCostRes.data);
      console.log('App.js DEBUG: Processed avgCostData for state:', processedAvgCostData);
      console.log('App.js DEBUG: Type of processedAvgCostData:', typeof processedAvgCostData, 'Is array:', Array.isArray(processedAvgCostData));


      // Fetch Top 5 Most Expensive Shipments (for homepage chart)
      const top5Res = await axios.get(`${API_BASE_URL}/top_5_expensive`);
      setTop5ExpensiveShipments(top5Res.data);

      // Fetch Priority Distribution by Status (for dedicated page)
      const priorityDistRes = await axios.get(`${API_BASE_URL}/priority_distribution_by_status`);
      setPriorityDistributionData(processPriorityDistributionData(priorityDistRes.data));

      // Fetch Weight vs. Cost for Express Service (for dedicated page)
      const correlationRes = await axios.get(`${API_BASE_URL}/weight_cost_express_correlation`);
      setWeightCostExpressCorrelation(correlationRes.data);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please ensure your Flask backend is running and accessible.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- useEffect to trigger initial data fetch ---
  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  // --- Render Loading/Error States ---
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <p className="text-xl text-gray-700">Loading dashboard data...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-red-100 text-red-800 p-4 rounded-lg">
          <p className="text-xl">Error: {error}</p>
        </div>
    );
  }

  // --- Render Current Page based on `currentPage` state ---
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
            <HomePage
                totalShipments={totalShipments}
                totalDelayedShipments={totalDelayedShipments}
                avgCostByCarrierData={avgCostByCarrierData}
                top5ExpensiveShipments={top5ExpensiveShipments}
            />
        );
      case 'shipments':
        return <ShipmentsPage apiBaseUrl={API_BASE_URL} />; // ShipmentsPage fetches its own data with filters/pagination
      case 'priority':
        return <PriorityDistributionPage data={priorityDistributionData} />;
      case 'weight_cost':
        return <WeightCostCorrelationPage data={weightCostExpressCorrelation} />;
      default:
        return <HomePage />; // Fallback to home page
    }
  };

  return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-inter">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-800">Starlinks Global Logistics Portal</h1>
          <p className="text-gray-600">Welcome to the Starlinks Global Logistics Portal Dashboard</p>
        </header>

        {/* Navigation Component */}
        <Navigation setCurrentPage={setCurrentPage} />

        {/* Render the selected page */}
        <main className="mt-8">
          {renderPage()}
        </main>
      </div>
  );
}

export default App;
