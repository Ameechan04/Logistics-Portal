// frontend/src/WeightCostCorrelationPage.js
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts'; // Import Line component

function WeightCostCorrelationPage({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-700">No Express correlation data available.</p>;
  }

  // Function to calculate linear regression line data (slope and intercept)
  const calculateLinearRegressionLine = (data) => {
    // Filter out invalid data points before calculation
    const validData = data.filter(point =>
      typeof point.WeightKG === 'number' && !isNaN(point.WeightKG) &&
      typeof point.CostUSD === 'number' && !isNaN(point.CostUSD)
    );

    if (validData.length < 2) return []; // Need at least two valid points to draw a line

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    const n = validData.length;

    // Calculate sums needed for linear regression formula
    validData.forEach(point => {
      const x = point.WeightKG;
      const y = point.CostUSD;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    // Calculate slope (m) and y-intercept (c)
    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = (n * sumX2) - (sumX * sumX);

    // Handle cases where denominator is zero (e.g., all X values are the same)
    if (denominator === 0) {
      // If all X values are the same, the line is vertical.
      // We can return a line at the average Y value, if meaningful.
      // For a scatter plot, a vertical line might not be what's expected for 'regression'.
      // For now, we'll return empty, but this could be enhanced for vertical lines.
      return [];
    }

    const slope = numerator / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Determine the min and max WeightKG values from valid data to define the line's endpoints
    const minWeight = Math.min(...validData.map(d => d.WeightKG));
    const maxWeight = Math.max(...validData.map(d => d.WeightKG));

    // Generate two points for the regression line using the calculated slope and intercept
    // Ensure the keys match the dataKeys of XAxis and YAxis for consistency
    const lineData = [
      { WeightKG: minWeight, CostUSD: slope * minWeight + intercept },
      { WeightKG: maxWeight, CostUSD: slope * maxWeight + intercept }
    ];

    return lineData;
  };

  // Calculate the regression line data based on the provided shipment data
  const regressionLineData = calculateLinearRegressionLine(data);

  // --- Debugging: Log regression line data to console ---
  console.log("Regression Line Data:", regressionLineData);

  // Calculate overall X and Y domains to ensure regression line is visible
  const allXValues = data.map(d => d.WeightKG).filter(val => typeof val === 'number' && !isNaN(val));
  const allYValues = [
    ...data.map(d => d.CostUSD), // All CostUSD values from scatter points
    ...(regressionLineData.length > 0 ? regressionLineData.map(d => d.CostUSD) : []) // All calculated Y values from regression line
  ].filter(val => typeof val === 'number' && !isNaN(val)); // Filter out non-numeric values

  const minX = allXValues.length > 0 ? Math.min(...allXValues) : 0;
  // Set maxX to 1000 as requested
  const maxX = 1000;
  const minY = allYValues.length > 0 ? Math.min(...allYValues) : 0;
  const maxY = allYValues.length > 0 ? Math.max(...allYValues) : 100;

  // Add some padding to the domain for better visualization (e.g., 10% buffer)
  const xDomainMin = Math.floor(minX * 0.9);
  const xDomainMax = Math.ceil(maxX * 1.1); // Still apply 10% buffer to the fixed max
  const yDomainMin = Math.floor(minY * 0.9);
  const yDomainMax = Math.ceil(maxY * 1.1);


  return (
    <section className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Correlation between Weight and Cost for Express Service Type</h2>
      {/* Increased height for the chart container */}
      <div style={{ width: '100%', height: '450px', display: 'flex', flexDirection: 'column' }}> {/* Height increased to 450px */}
        {/* Added a key prop to force re-render when data changes, helping with rendering issues */}
        <ResponsiveContainer width="100%" height="100%" key={data.length}>
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid />
            {/* X-axis for WeightKG - now with calculated domain */}
            <XAxis
              type="number"
              dataKey="WeightKG"
              name="Weight"
              unit=" kg"
              domain={[xDomainMin, maxX]} // Apply calculated domain, with fixed max
            />
            {/* Y-axis for CostUSD - now with calculated domain */}
            <YAxis
              type="number"
              dataKey="CostUSD"
              name="Cost"
              unit=" $"
              domain={[yDomainMin, yDomainMax]} // Apply calculated domain
            />
            {/* Tooltip to show details on hover */}
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name, props) => {
                if (name === 'Weight') return `${value} kg`;
                if (name === 'Cost') return `$${value.toFixed(2)}`;
                return value;
              }}
            />
            {/* Legend for the scatter plot */}
            <Legend />
            {/* Scatter points for Express Shipments */}
            <Scatter name="Express Shipments" data={data} fill="#000000" />
            {/* Add the Line component for the regression line */}
            {regressionLineData.length > 0 && ( // Only render line if data is sufficient
              <Line
                dataKey="CostUSD" // The calculated Y value for the line (matches YAxis dataKey)
                data={regressionLineData}
                type="linear" // Ensure it's drawn as a straight line
                stroke="#0000FF" // Changed to a bright blue for better visibility
                strokeWidth={3} // Increased thickness for better visibility
                dot={false} // Do not show individual dots on the line
                activeDot={false} // No active dot on hover
                name="Regression Line"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {/* Removed the raw data points section */}
    </section>
  );
}

export default WeightCostCorrelationPage;
