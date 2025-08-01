import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

import './Styles/PriorityDistribuation.css';

function PriorityDistributionPage({ apiBaseUrl }) {
  // state for processed data for charts
  const [data, setData] = useState([]);
  // unique carriers state for dropdown filter
  const [uniqueCarriers, setUniqueCarriers] = useState([]);
  // state for currently selected carrier
  const [selectedCarrier, setSelectedCarrier] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define colors for each priority level for consistent visualization
  const colors = {
    "High": "#ef4444", // a shade of red for high priority
    "Medium": "#f97316", // a shade of orange for medium priority
    "Low": "#22c55e" // a shade of green for low priority
  };

  // Helper function to transform the API response data for Recharts
  const processApiData = (apiData) => {
    const statusMap = {};
    apiData.forEach(item => {
      const status = item.DeliveryStatus;
      const priority = item.Priority;
      const count = item.Count;
      const carrier = item.CarrierName;

      if (!statusMap[status]) {
        statusMap[status] = { status: status, High: 0, Medium: 0, Low: 0, carrier: carrier };
      }
      statusMap[status][priority] = (statusMap[status][priority] || 0) + count;
      statusMap[status].carrier = carrier;
    });
    return Object.values(statusMap);
  };

  // Helper function to get data for a specific status from the main data array.
  const getStatusData = (statusName) => {
    return data.find(item => item.status === statusName) || { High: 0, Medium: 0, Low: 0 };
  };

  // Helper function to format data for pie charts
  const getPieData = (statusName) => {
    const statusData = getStatusData(statusName);
    return [
      { name: 'High', value: statusData.High },
      { name: 'Medium', value: statusData.Medium },
      { name: 'Low', value: statusData.Low },
    ].filter(entry => entry.value > 0); // Filter out entries with zero value for cleaner charts
  };

  // Custom formatter function for the Pie Chart Legend
  const renderColorfulLegendText = (value, entry) => {
    const { payload } = entry;
    const displayValue = payload && payload.value !== undefined ? ` (${payload.value})` : '';
    return <span style={{ color: entry.color }}>{`${value}${displayValue}`}</span>;
  };

  // --- Data Fetching Hooks ---

  // 1. useEffect to fetch unique carriers on initial load (only once)
  useEffect(() => {
    const fetchUniqueCarriers = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/unique_carriers`);
        const carriers = await response.json();
        setUniqueCarriers(carriers.map(c => (c || '').trim())); // Clean up carrier names
      } catch (err) {
        console.error("Error fetching unique carriers:", err);
      }
    };
    fetchUniqueCarriers();
  }, [apiBaseUrl]);

  // 2. useEffect to fetch chart data whenever the selectedCarrier changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct the URL with the selected carrier as a query parameter
        const url = selectedCarrier === 'All'
          ? `${apiBaseUrl}/priority_distribution_by_status`
          : `${apiBaseUrl}/priority_distribution_by_status?carrier=${encodeURIComponent(selectedCarrier.trim())}`;

        const response = await fetch(url);
        const result = await response.json();

        if (response.ok) {
          // Process the received data directly
          const processedData = processApiData(result);
          setData(processedData);
        } else {
          console.error('API Error:', result.error);
          setError("Failed to load chart data.");
          setData([]);
        }
      } catch (error) {
        console.error('Failed to fetch priority distribution data:', error);
        setError("Failed to load chart data. Is the backend running?");
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCarrier, apiBaseUrl]); // Re-run effect when selectedCarrier or apiBaseUrl changes

  // --- Event Handlers ---
  const handleFilterChange = (e) => {
    setSelectedCarrier(e.target.value);
  };

  // Prepare data for each of the four pie charts
  const deliveredPieData = getPieData("Delivered");
  const delayedPieData = getPieData("Delayed");
  const inTransitPieData = getPieData("In Transit");
  const cancelledPieData = getPieData("Cancelled");

  // Filter data for each specific status for the smaller charts
  const deliveredData = [getStatusData("Delivered")];
  const delayedData = [getStatusData("Delayed")];
  const inTransitData = [getStatusData("In Transit")];
  const cancelledData = [getStatusData("Cancelled")];

  if (loading) {
    return (
      <div className="content-container">
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="carrierFilter" style={{ marginRight: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Carrier:</label>
            <select id="carrierFilter" name="carrier" value={selectedCarrier} onChange={handleFilterChange} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }} disabled>
              <option>Loading...</option>
            </select>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>Loading priority distribution data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-container">
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="carrierFilter" style={{ marginRight: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Carrier:</label>
            <select id="carrierFilter" name="carrier" value={selectedCarrier} onChange={handleFilterChange} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}>
              <option value="All">All Carriers</option>
              {uniqueCarriers.map((carrierName) => (
                  <option key={carrierName} value={carrierName}>{carrierName}</option>
              ))}
            </select>
          </div>
        </div>
        <p style={{ textAlign: 'center', color: '#dc2626', marginTop: '2rem' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
        {/* carrier filter */}
        <div>
          <label htmlFor="carrierFilter" style={{ marginRight: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Carrier:</label>
          <select
              id="carrierFilter"
              name="carrier"
              value={selectedCarrier}
              onChange={handleFilterChange}
              style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
          >
              <option value="All">All Carriers</option>
              {uniqueCarriers.map((carrierName) => (
                  <option key={carrierName} value={carrierName}>{carrierName}</option>
              ))}
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>No priority distribution data available for the selected carrier.</p>
      ) : (
      <>
        {/* Main stacked bar chart */}
        <div id ="topSectionDiv">
          <div id="topLeftDiv">
            <h2 id="headTitle">Distribution of Shipment Priority by Delivery Status</h2>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="High" stackId="a" fill={colors["High"]} barSize={30} />
                <Bar dataKey="Medium" stackId="a" fill={colors["Medium"]} barSize={30} />
                <Bar dataKey="Low" stackId="a" fill={colors["Low"]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        <div id="topRightDiv">
            {/* 1. pie chart for Delivered Shipments */}
            <div className="pieChartContainer">
              <h3 className="pieChartTitle">Delivered Shipments by Priority</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={deliveredPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                    {deliveredPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={renderColorfulLegendText}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/*2. pie chart for delayed shipments */}
            <div className="pieChartContainer">
              <h3 className="pieChartTitle">Delayed Shipments by Priority</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={delayedPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                    {delayedPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={renderColorfulLegendText}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* pie chart for in transit shipments */}
            <div className="pieChartContainer">
              <h3 className="pieChartTitle">In-Transit Shipments by Priority</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={inTransitPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                    {inTransitPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={renderColorfulLegendText}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* pie for cancelled shipments */}
            <div className="pieChartContainer">
              <h3 className="pieChartTitle">Cancelled Shipments by Priority</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={cancelledPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                    {cancelledPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={renderColorfulLegendText}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
        </div>
        </div>

        {/* smaller individual bar charts for each status */}
        <div id="lineGraphsDiv">
          {/* delivered chart */}
          <div className="chartList">
            <h3 style={{ textAlign: 'center', fontWeight: '500' }}>Delivered Shipments by Priority</h3>
            <ResponsiveContainer height={250}>
              <BarChart data={deliveredData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" hide={true} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="High" fill={colors["High"]} barSize={30} />
                <Bar dataKey="Medium" fill={colors["Medium"]} barSize={30} />
                <Bar dataKey="Low" fill={colors["Low"]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* delayed chart */}
          <div className="chartList">
            <h3 style={{ textAlign: 'center', fontWeight: '500' }}>Delayed Shipments by Priority</h3>
            <ResponsiveContainer height={250}>
              <BarChart data={delayedData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" hide={true} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="High" fill={colors["High"]} barSize={30} />
                <Bar dataKey="Medium" fill={colors["Medium"]} barSize={30} />
                <Bar dataKey="Low" fill={colors["Low"]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* in transit chart */}
          <div className="chartList">
            <h3 style={{ textAlign: 'center', fontWeight: '500' }}>In-Transit Shipments by Priority</h3>
            <ResponsiveContainer height={250}>
              <BarChart data={inTransitData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" hide={true} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="High" fill={colors["High"]} barSize={30} />
                <Bar dataKey="Medium" fill={colors["Medium"]} barSize={30} />
                <Bar dataKey="Low" fill={colors["Low"]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* cancelled chart */}
          <div className="chartList">
            <h3 style={{ textAlign: 'center', fontWeight: '500' }}>Cancelled Shipments by Priority</h3>
            <ResponsiveContainer height={250}>
              <BarChart data={cancelledData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" hide={true} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="High" fill={colors["High"]} barSize={30} />
                <Bar dataKey="Medium" fill={colors["Medium"]} barSize={30} />
                <Bar dataKey="Low" fill={colors["Low"]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default PriorityDistributionPage;
