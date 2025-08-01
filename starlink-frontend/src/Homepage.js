import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell // Import PieChart components
} from 'recharts';
import './Styles/Homepage.css';

const API_BASE_URL = 'http://localhost:5000/api';

function HomePage() {
  // State for all dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalShipments: null,
    totalDelayedShipments: null,
    avgCostByCarrierData: [],
    top5ExpensiveShipments: [],
    delayedPast3Months: null,
    ordersPast3Months: null,
    uniqueCarriers: [], // To populate the carrier filter dropdown
  });

  // State for filters and sorting
  const [filters, setFilters] = useState({
    carrier: 'All',
    status: 'All',
    serviceType: 'All',
  });

  // Loading and error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // data fetching
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Construct the query string from the current filter state
    const queryParams = new URLSearchParams();
    if (filters.carrier !== 'All') queryParams.append('carrier', filters.carrier);
    if (filters.status !== 'All') queryParams.append('status', filters.status);
    if (filters.serviceType !== 'All') queryParams.append('service_type', filters.serviceType);
    const queryString = queryParams.toString();

    try {
      // Use Promise.all to fetch all data concurrently with the new filters
      const [
        totalShipmentsRes,
        delayedRes,
        delayedPast3MonthsRes,
        ordersPast3MonthsRes,
        top5Res,
        avgCostRes,
        uniqueCarriersRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/shipments?${queryString}`),
        axios.get(`${API_BASE_URL}/total_delayed?${queryString}`),
        axios.get(`${API_BASE_URL}/delayed_last_3_months?${queryString}`),
        axios.get(`${API_BASE_URL}/orders_last_3_months?${queryString}`),
        axios.get(`${API_BASE_URL}/top_5_expensive?${queryString}`),
        axios.get(`${API_BASE_URL}/average_shipment_by_carrier?${queryString}`),
        axios.get(`${API_BASE_URL}/unique_carriers`) // unique carriers don't need filters
      ]);

      // Update the dashboard data state with the fetched information
      setDashboardData({
        totalShipments: totalShipmentsRes.data.totalCount,
        totalDelayedShipments: delayedRes.data.count,
        ordersPast3Months: ordersPast3MonthsRes.data.count,
        delayedPast3Months: delayedPast3MonthsRes.data.count,
        top5ExpensiveShipments: top5Res.data,
        avgCostByCarrierData: avgCostRes.data.map(item => ({
          carrier: item.Carrier,
          averageCost: item.AverageCost
        })),
        uniqueCarriers: uniqueCarriersRes.data
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load data. Please ensure your backend is running and the API endpoints are correct.");
    } finally {
      setLoading(false);
    }
  }, [filters]); // dependency array


  // runs on initial load and whenever filters change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  //ui handling
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const calculateOverallAverageCost = () => {
    if (!dashboardData.avgCostByCarrierData || dashboardData.avgCostByCarrierData.length === 0) return 'N/A';
    const totalCost = dashboardData.avgCostByCarrierData.reduce((sum, item) => sum + item.averageCost, 0);
    return `$${(totalCost / dashboardData.avgCostByCarrierData.length).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  }

  // preparing data for charts
  const onTimeShipments = (dashboardData.totalShipments || 0) - (dashboardData.totalDelayedShipments || 0);
  const pieChartData = [
    { name: 'On Time', value: onTimeShipments, color: '#4CAF50' }, // Green
    { name: 'Delayed', value: dashboardData.totalDelayedShipments || 0, color: '#F44336' }, // Red
  ];

  const onTimeShipments3Months = (dashboardData.ordersPast3Months || 0) - (dashboardData.delayedPast3Months || 0);
  const pieChartData2 = [
    { name: 'On Time', value: onTimeShipments3Months, color: '#4CAF50' }, // Green
    { name: 'Delayed', value: dashboardData.delayedPast3Months || 0, color: '#F44336' }, // Red
  ];

  const PIE_COLORS = ['#00850f', '#F44336']; // Green for On Time, Red for Delayed

  // skeleton page shows when loading
  if (loading) {
      return (
          <div>

              <div id="filterControlsHomepage">
                 <p id="loadingText">Loading Dashboard...</p>
              </div>

              <section id="overviewMetricsSection">

                  <div className="metricsList"></div>
                  <div className="metricsList"></div>
                  <div className="metricsList"></div>
                  <div className="metricsList"></div>
                  <div className="metricsList"></div>
                  <div className="metricsList"></div>


              </section>
          </div>
      );
  }

  if (error) {
    return (
        <div>
          <p>Error: {error}</p>
        </div>
    );
  }

  // destructure dashboard data for easier access in JSX
  const {
    totalShipments,
    totalDelayedShipments,
    avgCostByCarrierData,
    top5ExpensiveShipments,
    delayedPast3Months,
    ordersPast3Months,
    uniqueCarriers
  } = dashboardData;

  return (
    <div>
      {/* Filters Section */}

      <div id="filterControlsHomepage">
         <h1 id="companyDisplayed">
          Showing Data for {filters.carrier === 'All' ? 'All Companies' : filters.carrier}
        </h1>
        <br></br>
        <div className= "filterList">
          <label htmlFor="carrierFilter">carrier:</label>
          <select
              id="carrierFilter"
              name="carrier"
              value={filters.carrier}
              onChange={handleFilterChange}
          >
            <option value="All">all carriers</option>
            {/* dynamically render carrier options */}
            {uniqueCarriers.map((carrierName) => (
              <option key={carrierName} value={carrierName}>{carrierName}</option>
            ))}
          </select>
        </div>

        {/* status filter */}
        <div className= "filterList">
          <label htmlFor="statusFilter">status:</label>
          <select
              id="statusFilter"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
          >
            <option value="All">all statuses</option>
            <option value="Delivered">delivered</option>
            <option value="In Transit">in transit</option>
            <option value="Delayed">delayed</option>
            <option value="Cancelled">cancelled</option>
            <option value="Pending">pending</option>
          </select>
        </div>

        {/* service type filter */}
        <div className= "filterList">
          <label htmlFor="serviceTypeFilter">service type:</label>
          <select
              id="serviceTypeFilter"
              name="serviceType"
              value={filters.serviceType}
              onChange={handleFilterChange}
          >
            <option value="All">all service types</option>
            <option value="Standard">standard</option>
            <option value="Express">express</option>
            <option value="Economy">economy</option>
          </select>
        </div>
      </div>
      {/* Overview Metrics */}

      <section id="overviewMetricsSection">
        <div className="metricsList">
          <h2>All Delayed Shipments</h2>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} shipments`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        </div>
        <div className="metricsList" id = "percentageContainer">
          <h3>Out of {totalShipments} shipments, there has been  {totalDelayedShipments !== null ? totalDelayedShipments : 'N/A'} delayed shipments.</h3>
         <h1>
           <span className="percentageDelayed">
             {totalShipments > 0 ? ((totalDelayedShipments / totalShipments) * 100).toFixed(2) : '0.00'}%
           </span> Delayed
        </h1>
          <br></br>
          <h3>In the past 3 months, there has been {ordersPast3Months} shipments, with {delayedPast3Months !== null ? delayedPast3Months : 'N/A'} delayed shipments.</h3>
          <h1>
           <span className="percentageDelayed">
             {ordersPast3Months > 0 ? ((delayedPast3Months / ordersPast3Months) * 100).toFixed(2) : '0.00'}%
           </span> Delayed
        </h1>
        </div>
        <div className="metricsList" id = "averageContainer">
          <h3>Overall Average Cost  {calculateOverallAverageCost()}</h3>
           <div style={{ width: '100%', height: '300px' }}>
          <h2>Average Cost by Carrier</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={avgCostByCarrierData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="carrier" angle={-15} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="averageCost" fill="#8884d8" name="Average Cost" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>
        <div className="metricsList">
           <h2>Delays in the Past 3 Months:</h2>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData2}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieChartData2.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} shipments`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        </div>
        <div className="metricsList">
         <div className="top-expensive-table-container">
            <h2>Top 5 Most Expensive Shipments</h2>
            {top5ExpensiveShipments && top5ExpensiveShipments.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Shipment ID</th>
                    <th>Carrier</th>
                    <th>Cost (USD)</th>
                    <th>Origin</th>
                    <th>Destination</th>
                    <th>Service Type</th>
                    <th>Weight (KG)</th>
                    <th>Date</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {top5ExpensiveShipments.map((shipment) => (
                    <tr key={shipment.ShipmentID}>
                      <td>{shipment.ShipmentID}</td>
                      <td>{shipment.Carrier}</td>
                      <td>${shipment.CostUSD?.toFixed(2)}</td>
                      <td>{shipment.Origin}</td>
                      <td>{shipment.Destination}</td>
                      <td>{shipment.ServiceType}</td>
                      <td>{shipment.WeightKG}</td>
                      <td> {shipment.DeliveryDate !== null ? formatDate(shipment.DeliveryDate) : 'N/A'}</td>
                      <td>{shipment.Priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No top 5 expensive shipments data available.</p>
            )}
          </div>
        </div>
        <div className="metricsList">
        <div style={{ width: '100%', height: '400px ' }}>
          <h2>Top 5 Most Expensive Shipments</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top5ExpensiveShipments} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="WeightKG" angle={-30} textAnchor="end" height={40}  tickFormatter={(value) => `${value}KG`}/>
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
               <Legend
    verticalAlign="bottom"
    wrapperStyle={{ paddingTop: 30 }}
  />
              <Bar dataKey="CostUSD" fill="#007bff" name="Cost (USD)" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
