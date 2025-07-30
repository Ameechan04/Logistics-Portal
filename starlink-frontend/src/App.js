// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css'; 
import Navigation from './Navigation';
import HomePage from './Homepage';
import ShipmentsPage from './ShipmentsPage';
import PriorityDistributionPage from './PriorityDistributionPage';
import WeightCostCorrelationPage from './WeightCostPage';

const API_BASE_URL = 'http://localhost:5000/api';


function App() {
  // state for managing current page
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'shipments', 'priority', 'weight_cost'

  // states for data
  const [totalShipments, setTotalShipments] = useState(0);
  const [totalDelayedShipments, setTotalDelayedShipments] = useState(null);
  const [avgCostByCarrierData, setAvgCostByCarrierData] = useState([]);
  const [top5ExpensiveShipments, setTop5ExpensiveShipments] = useState([]);
  const [priorityDistributionData, setPriorityDistributionData] = useState([]);
  const [weightCostExpressCorrelation, setWeightCostExpressCorrelation] = useState([]);

  // load and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // average cost helper function
  const processAverageCostData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      carrier: item.Carrier,
      averageCost: item.AverageCost
    }));
  };

  // helper function for priority distribution 
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

  // fetch ALL data for dashboard
  const fetchAllDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // fetch total shipments (no.)
      const totalShipmentsRes = await axios.get(`${API_BASE_URL}/shipments`);
      setTotalShipments(totalShipmentsRes.data.totalCount);

      // fetch total delayed shipments
      const delayedRes = await axios.get(`${API_BASE_URL}/total_delayed`);
      setTotalDelayedShipments(delayedRes.data.count);

      //fetch avg cost by carrier
      const avgCostRes = await axios.get(`${API_BASE_URL}/average_shipment_by_carrier`);

      const processedAvgCostData = processAverageCostData(avgCostRes.data);
      

      setAvgCostByCarrierData(processedAvgCostData);

      // todo remove logs
      console.log('App.js DEBUG: Raw avgCostRes.data:', avgCostRes.data);
      console.log('App.js DEBUG: Processed avgCostData for state:', processedAvgCostData);
      console.log('App.js DEBUG: Type of processedAvgCostData:', typeof processedAvgCostData, 'Is array:', Array.isArray(processedAvgCostData));


      // fetch top 5 most expensive (for homepage chart)
      const top5Res = await axios.get(`${API_BASE_URL}/top_5_expensive`);
      setTop5ExpensiveShipments(top5Res.data);

      // fetch priority dist. (for its own page)
      const priorityDistRes = await axios.get(`${API_BASE_URL}/priority_distribution_by_status`);
      setPriorityDistributionData(processPriorityDistributionData(priorityDistRes.data));

      // fetch weight / cost for express service (for its own page)
      const correlationRes = await axios.get(`${API_BASE_URL}/weight_cost_express_correlation`);
      setWeightCostExpressCorrelation(correlationRes.data);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please ensure your Flask backend is running and accessible.");
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect is used to trigger initial data fetch
  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  // render load/error states
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

  // render current page based on `currentPage` state
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

        {/* nav component */}
        <Navigation setCurrentPage={setCurrentPage} />

        {/* render selected page */}
        <main className="mt-8">
          {renderPage()}
        </main>
      </div>
  );
}

export default App;
