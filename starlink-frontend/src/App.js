// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Styles/App.css';
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
  const [uniqueCarriers, setUniqueCarriers] = useState([]);
  const [delayedPast3Months, setDelayedPast3Months] = useState(null);
  const [ordersPast3Months, setOrdersPast3Months] = useState(null);

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
      // create an array of all promises for api calls
      const [
        totalShipmentsRes,
        delayedRes,
        avgCostRes,
        top5Res,
        priorityDistRes,
        correlationRes,
        uniqueCarriersRes,
          delayedPast3MonthsRes,
          ordersPast3MonthsRes,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/shipments`),
        axios.get(`${API_BASE_URL}/total_delayed`),
        axios.get(`${API_BASE_URL}/average_shipment_by_carrier`),
        axios.get(`${API_BASE_URL}/top_5_expensive`),
        axios.get(`${API_BASE_URL}/priority_distribution_by_status`),
        axios.get(`${API_BASE_URL}/weight_cost_express_correlation`),
        axios.get(`${API_BASE_URL}/unique_carriers`),
        axios.get(`${API_BASE_URL}/delayed_last_3_months`),
        axios.get(`${API_BASE_URL}/orders_last_3_months`),
      ]);

      // process and set state for each response
      setTotalShipments(totalShipmentsRes.data.totalCount);
      setTotalDelayedShipments(delayedRes.data.count);
      setDelayedPast3Months(delayedPast3MonthsRes.data.count);
      setOrdersPast3Months(ordersPast3MonthsRes.data.count);

      const processedAvgCostData = processAverageCostData(avgCostRes.data);
      setAvgCostByCarrierData(processedAvgCostData);

      setTop5ExpensiveShipments(top5Res.data);
      setPriorityDistributionData(processPriorityDistributionData(priorityDistRes.data));
      setWeightCostExpressCorrelation(correlationRes.data);
      setUniqueCarriers(uniqueCarriersRes.data); // set unique carriers state

    } catch (err) {
      console.error("error fetching dashboard data:", err);
      setError("failed to load dashboard data. please ensure your flask backend is running and accessible.");
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
                delayedPast3Months={delayedPast3Months}
                ordersPast3Months={ordersPast3Months}
            />
        );
      case 'shipments':
        return <ShipmentsPage apiBaseUrl={API_BASE_URL} uniqueCarriers={uniqueCarriers} />; // pass unique carriers as prop
      case 'priority':
        return <PriorityDistributionPage data={priorityDistributionData} />;
      case 'weight_cost':
        return <WeightCostCorrelationPage data={weightCostExpressCorrelation} />;
      default:
        return <HomePage />; // Fallback to home page
    }
  };

  return (
      <div>
        <header>
          <h1 className="titleText">Starlinks Global Logistics Portal</h1>
          <p className="welcomeText">Welcome to the Starlinks Global Logistics Portal Dashboard</p>


        {/* nav component */}
        <Navigation setCurrentPage={setCurrentPage} />
        </header>
        {/* render selected page */}
        <main className="mt-8">
          {renderPage()}
        </main>
      </div>
  );
}

export default App;
