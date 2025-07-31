// frontend/src/HomePage.js
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell // Import PieChart components
} from 'recharts';
import './Styles/Homepage.css';

function HomePage({ totalShipments, totalDelayedShipments, avgCostByCarrierData, top5ExpensiveShipments, delayedPast3Months, ordersPast3Months }) {
  const calculateOverallAverageCost = () => {
    if (!avgCostByCarrierData || avgCostByCarrierData.length === 0) return 'N/A';
    const totalCost = avgCostByCarrierData.reduce((sum, item) => sum + item.averageCost, 0);
    return `$${(totalCost / avgCostByCarrierData.length).toFixed(2)}`;
  };



const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

  // Prepare data for the Total Shipments vs. Delayed Shipments Pie Chart
  const onTimeShipments = totalShipments - (totalDelayedShipments || 0); // Handle null for totalDelayedShipments
  const pieChartData = [
    { name: 'On Time', value: onTimeShipments, color: '#4CAF50' }, // Green
    { name: 'Delayed', value: totalDelayedShipments || 0, color: '#F44336' }, // Red
  ];

  const onTimeShipments3Months = ordersPast3Months - (delayedPast3Months || 0); // Handle null for totalDelayedShipments
  const pieChartData2 = [
    { name: 'On Time', value: onTimeShipments3Months, color: '#4CAF50' }, // Green
    { name: 'Delayed', value: delayedPast3Months || 0, color: '#F44336' }, // Red
  ];


  // Colors for the Pie Chart slices
  const PIE_COLORS = ['#00850f', '#F44336']; // Green for On Time, Red for Delayed

  return (
    <div>
      {/* Overview Metrics */}
       <h1 id = "companyDisplayed">Showing Data for All Companies</h1>
{/* carrier filter */}
{/*                    <div>*/}
{/*                        <label htmlFor="carrierFilter">carrier:</label>*/}
{/*                        <select*/}
{/*                            id="carrierFilter"*/}
{/*                            name="carrier"*/}
{/*                            value={filters.carrier}*/}
{/*                            onChange={handleFilterChange}*/}
{/*                        >*/}
{/*                            <option value="All">all carriers</option>*/}
{/*                          /!* dynamically render carrier options *!/*/}
{/*                          {uniqueCarriers.map((carrierName) => (*/}
{/*                            <option key={carrierName} value={carrierName}>{carrierName}</option>*/}
{/*                          ))}*/}
{/*                        </select>*/}
{/*                    </div>*/}

{/*                    /!* status filter *!/*/}
{/*                    <div>*/}
{/*                        <label htmlFor="statusFilter">status:</label>*/}
{/*                        <select*/}
{/*                            id="statusFilter"*/}
{/*                            name="status"*/}
{/*                            value={filters.status}*/}
{/*                            onChange={handleFilterChange}*/}
{/*                        >*/}
{/*                            <option value="All">all statuses</option>*/}
{/*                            <option value="Delivered">delivered</option>*/}
{/*                            <option value="In Transit">in transit</option>*/}
{/*                            <option value="Delayed">delayed</option>*/}
{/*                            <option value="Cancelled">cancelled</option>*/}
{/*                            <option value="Pending">pending</option>*/}
{/*                        </select>*/}
{/*                    </div>*/}

{/*                    /!* service type filter *!/*/}
{/*                    <div>*/}
{/*                        <label htmlFor="serviceTypeFilter">service type:</label>*/}
{/*                        <select*/}
{/*                            id="serviceTypeFilter"*/}
{/*                            name="serviceType"*/}
{/*                            value={filters.serviceType}*/}
{/*                            onChange={handleFilterChange}*/}
{/*                        >*/}
{/*                            <option value="All">all service types</option>*/}
{/*                            <option value="Standard">standard</option>*/}
{/*                            <option value="Express">express</option>*/}
{/*                            <option value="Economy">economy</option>*/}
{/*                        </select>*/}
{/*                    </div>*/}



      {/**/}
      <section id="overviewMetricsSection">

        <div class="metricsList">

          <h2>All Delayed Shipments</h2>
        {/* Added explicit height to the div containing ResponsiveContainer */}
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
             {((totalDelayedShipments / totalShipments) * 100).toFixed(2)}%
           </span> Delayed
        </h1>
          <br></br>
          <h3>In the past 3 months, there has been {ordersPast3Months} shipments, with {delayedPast3Months !== null ? delayedPast3Months : 'N/A'} delayed shipments.</h3>
          <h1>
           <span className="percentageDelayed">
             {((delayedPast3Months / ordersPast3Months) * 100).toFixed(2)}%
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
              <Bar dataKey="averageCost" fill="#8884d8" name="Average Cost" barSize={40} /> {/* Added barSize */}
            </BarChart>
          </ResponsiveContainer>
        </div>

        </div>
        <div className="metricsList">
          {/*<h3>Delayed Past 3 Months</h3>*/}
          {/*<p>*/}
          {/*  {delayedPast3Months !== null ? delayedPast3Months : 'N/A'}*/}
          {/*</p>*/}
           <h2>Delays in the Past 3 Months:</h2>
        {/* Added explicit height to the div containing ResponsiveContainer */}
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
         <div className="top-expensive-table-container"> {/* Optional container for styling */}
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
              {/*<XAxis dataKey="ShipmentID" angle={-90} textAnchor="end" height={100} tick={{ fontSize: 8 }}*/}
              <XAxis dataKey="WeightKG" angle={-30} textAnchor="end" height={40}  tickFormatter={(value) => `${value}KG`}/>
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
               <Legend
    verticalAlign="bottom" // Ensures the legend is at the bottom of the chart area
    wrapperStyle={{ paddingTop: 30 }} // Adds 30px of padding above the legend, pushing it down
  />
              <Bar dataKey="CostUSD" fill="#007bff" name="Cost (USD)" barSize={40} /> {/* Added barSize */}
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>


      </section>



    </div>
  );
}

export default HomePage;
