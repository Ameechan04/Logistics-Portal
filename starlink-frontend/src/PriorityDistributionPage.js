// frontend/src/PriorityDistributionPage.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function PriorityDistributionPage({ data }) {
  if (!data || data.length === 0) {
    return <p>no priority distribution data available.</p>;
  }

  // define colors for each priority level for consistent visualization
  const colors = {
    "High": "#ef4444", // a shade of red for high priority
    "Medium": "#f97316", // a shade of orange for medium priority
    "Low": "#22c55e" // a shade of green for low priority
  };

  // helper function to filter data for a specific status
  const getStatusData = (statusName) => {
    const statusEntry = data.find(item => item.status === statusName);
    // return an array containing the single status entry, or an empty array if not found
    // this format is suitable for recharts BarChart which expects an array
    return statusEntry ? [statusEntry] : [];
  };

  // filter data for each specific status
  const deliveredData = getStatusData("Delivered");
  const delayedData = getStatusData("Delayed");
  const inTransitData = getStatusData("In Transit");
  const cancelledData = getStatusData("Cancelled");

  return (
    <div>
      {/* main stacked bar chart */}
      <div style={{ width: '100%', height: 400, marginBottom: '80px' }}>
        <h2>Distribution of Shipment Priority by Delivery Status</h2>
        <ResponsiveContainer>
          {/* bar chart component from recharts */}
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            {/* grid lines for better readability */}
            <CartesianGrid strokeDasharray="3 3" />
            {/* x-axis displaying the delivery status */}
            <XAxis dataKey="status" />
            {/* y-axis displaying the count of shipments */}
            <YAxis />
            {/* tooltip to show details on hover */}
            <Tooltip />
            {/* legend to identify the bars by priority */}
            <Legend />
            {/* bars for each priority level, stacked using stackId="a" */}
            <Bar dataKey="High" stackId="a" fill={colors["High"]} barSize={30} />
            <Bar dataKey="Medium" stackId="a" fill={colors["Medium"]} barSize={30} />
            <Bar dataKey="Low" stackId="a" fill={colors["Low"]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* smaller individual bar charts for each status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* delivered chart */}
        <div style={{ height: 250 }}>
          <h3>Delivered Shipments by Priority</h3>
          <ResponsiveContainer>
            <BarChart data={deliveredData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
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
        <div style={{ height: 250 }}>
          <h3>Delayed Shipments by Priority</h3>
          <ResponsiveContainer>
            <BarChart data={delayedData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
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
        <div style={{ height: 250 }}>
          <h3>In-Transit Shipments by Priority</h3>
          <ResponsiveContainer>
            <BarChart data={inTransitData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
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
        <div style={{ height: 250 }}>
          <h3>Cancelled Shipments by Priority</h3>
          <ResponsiveContainer>
            <BarChart data={cancelledData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
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
    </div>
  );
}

export default PriorityDistributionPage;
