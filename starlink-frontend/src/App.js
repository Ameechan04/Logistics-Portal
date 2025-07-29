// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './App.css';

//api url
const API_BASE_URL = 'http://localhost:5000/api';

const processAverageCostData = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map(item => ({
    carrier: item.Carrier,
    averageCost: item.AverageCost
  }));
};

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

  // Define custom sort order for status and priority for consistent chart display
  const statusOrder = ["Delivered", "Delayed", "In Transit", "Cancelled"];
  const priorityOrder = ["High", "Medium", "Low"]; // For legend/bar ordering

  // Sort the result array by custom status order
  result.sort((a, b) => {
    const orderA = statusOrder.indexOf(a.status);
    const orderB = statusOrder.indexOf(b.status);
    return orderA - orderB;
  });

  return result;
};


function App() {
  // state for shipment table
  const [shipments, setShipments] = useState([]);
  const [totalShipments, setTotalShipments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default pagination limit

  // filter states
  const [filters, setFilters] = useState({
    carrier: '',
    status: '',
    serviceType: ''
  });

  // chart data states
  const [avgCostByCarrierData, setAvgCostByCarrierData] = useState([]);
  const [totalDelayedShipments, setTotalDelayedShipments] = useState(null);
  const [top5ExpensiveShipments, setTop5ExpensiveShipments] = useState([]);
  const [priorityDistributionData, setPriorityDistributionData] = useState([]);
  const [weightCostExpressCorrelation, setWeightCostExpressCorrelation] = useState([]);

  // error/loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetch all shipments (for table view)
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      };
      const response = await axios.get(`${API_BASE_URL}/shipments`, { params });
      setShipments(response.data.shipments);
      setTotalShipments(response.data.totalCount);
    } catch (err) {
      console.error("Error fetching shipments for table:", err);
      setError("Failed to load shipment data for table. Is backend running?");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]); // Dependencies for useCallback

  // data for charts:
  const fetchChartData = useCallback(async () => {
    setLoading(true); // Can have separate loading for charts if preferred
    setError(null);
    try {
      // 1. average cost by carrier
      // const avgCostRes = await axios.get(`${API_BASE_URL}/average_shipment_by_carrier`);
      // setAvgCostByCarrierData(processAverageCostData(avgCostRes.data));

      // 2. total delayed
      const delayedRes = await axios.get(`${API_BASE_URL}/delayed_last_3_months`);
      setTotalDelayedShipments(delayedRes.data.total_delayed_shipments);

      // 3. 5 most expensive
      // const top5Res = await axios.get(`${API_BASE_URL}/top_5_expensive`);
      // setTop5ExpensiveShipments(top5Res.data);

      // 4. priority dist
      // const priorityDistRes = await axios.get(`${API_BASE_URL}/priority_distribution_by_status`);
      // setPriorityDistributionData(processPriorityDistributionData(priorityDistRes.data));

      // 5. weight cost correlation
      // const correlationRes = await axios.get(`${API_BASE_URL}/weight_cost_express_correlation`);
      // setWeightCostExpressCorrelation(correlationRes.data);

    } catch (err) {
      console.error("Error fetching chart data:", err);
      setError("Failed to load chart data. Is backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect hooks for triggering data fetch
  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]); // need to re-fetch when filters or page change

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]); // re-fetch on first load or refresh

  // --- Filter Handlers ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value === 'All' ? '' : value //all selected = clear filters
    }));
    setCurrentPage(1); // default to first page
  };

  // page handler
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const totalPages = Math.ceil(totalShipments / itemsPerPage);


  if (loading && shipments.length === 0) { // full loading screen shown if no data loaded
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-inter">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-800">Starlinks Global Logistics Portal</h1>
        <p className="text-gray-600">Welcome to the Starlinks Global Logistics Portal Dashboard</p>
      </header>

      {/*filters:*/}
      <section className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* carrier */}
          <div>
            <label htmlFor="carrierFilter" className="block text-sm font-medium text-gray-700 mb-1">Carrier:</label>
            <select
              id="carrierFilter"
              name="carrier"
              value={filters.carrier}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="All">All Carriers</option>
              {/* todo : make come from separate API call to get unique carriers */}
              <option value="Starlinks Express">Starlinks Express</option>
              <option value="Global Freight">Global Freight</option>
              <option value="Swift Logistics">Swift Logistics</option>
              <option value="RapidRoute">RapidRoute</option>
              <option value="Pioneer Cargo">Pioneer Cargo</option>
            </select>
          </div>

          {/* status: */}
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
            <select
              id="statusFilter"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Delivered">Delivered</option>
              <option value="In Transit">In Transit</option>
              <option value="Delayed">Delayed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* quality filter */}
          <div>
            <label htmlFor="serviceTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">Service Type:</label>
            <select
              id="serviceTypeFilter"
              name="serviceType"
              value={filters.serviceType}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="All">All Service Types</option>
              <option value="Standard">Standard</option>
              <option value="Express">Express</option>
              <option value="Economy">Economy</option>
            </select>
          </div>
        </div>
      </section>

      {/* summary section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-600">Total Shipments</h3>
          <p className="text-4xl font-bold text-blue-600">{totalShipments}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-600">Total Delayed Shipments</h3>
          <p className="text-4xl font-bold text-red-600">
            {totalDelayedShipments !== null ? totalDelayedShipments : 'N/A'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-600">Avg Cost (All Carriers)</h3>

          <p className="text-4xl font-bold text-green-600">
            {avgCostByCarrierData.length > 0 ?
              `$${(avgCostByCarrierData.reduce((sum, item) => sum + item.averageCost, 0) / avgCostByCarrierData.length).toFixed(2)}`
              : 'N/A'}
          </p>
        </div>
      </section>

      {/* graphs (todo) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 1: Average Cost by Carrier */}
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Average Cost by Carrier</h2>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={avgCostByCarrierData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="carrier" angle={-15} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="averageCost" fill="#8884d8" name="Average Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2: Priority Distribution by Status (Stacked Bar Chart) */}
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Shipment Priority Distribution by Status</h2>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={priorityDistributionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" angle={-15} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* todo double check correct datakey */}
              <Bar dataKey="High" stackId="a" fill="#82ca9d" />
              <Bar dataKey="Medium" stackId="a" fill="#ffc658" />
              <Bar dataKey="Low" stackId="a" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3: top 5 expensive*/}
        <div className="bg-white p-4 rounded-lg shadow-md h-96 col-span-1 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Top 5 Most Expensive Shipments</h2>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={top5ExpensiveShipments} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ShipmentID" angle={-15} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="CostUSD" fill="#007bff" name="Cost (USD)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* scatter plot of weight vs cost (todo) */}
        <div className="bg-white p-4 rounded-lg shadow-md h-96 col-span-1 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Weight vs. Cost (Express Service)</h2>
          <ResponsiveContainer width="100%" height="80%">
            {/* todo make custom scatter plot */}
           <ul className="list-disc list-inside p-4 max-h-80 overflow-y-auto">
              {weightCostExpressCorrelation.map((item, index) => (
                <li key={index} className="text-sm text-gray-600">
                  Weight: {item.WeightKG} KG, Cost: ${item.CostUSD}
                </li>
              ))}
              {weightCostExpressCorrelation.length === 0 && <p className="text-gray-500">No Express correlation data.</p>}
            </ul>
          </ResponsiveContainer>
        </div>


      </section>

      {/* table view */}
      <section className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Shipment Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carrier</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (KG)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (USD)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shipments.map((shipment) => (
                <tr key={shipment.ShipmentID}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.ShipmentID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.Origin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.Destination}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.Carrier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.DeliveryStatus}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.ServiceType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.WeightKG}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${shipment.CostUSD?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(shipment.ShipmentDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(shipment.DeliveryDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.Priority}</td>
                </tr>
              ))}
              {shipments.length === 0 && !loading && (
                <tr>
                  <td colSpan="11" className="px-6 py-4 text-center text-sm text-gray-500">No shipments found with current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination controls */}
        <nav className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalShipments)}</span> of{' '}
                <span className="font-medium">{totalShipments}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  {/* Heroicon name: solid/chevron-left */}
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* all page numbers generated for debugging */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </nav>
      </section>
    </div>
  );
}

export default App;
