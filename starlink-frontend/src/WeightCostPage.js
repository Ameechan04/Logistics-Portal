import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import './Styles/PriorityDistribuation.css'
function WeightCostPage({ apiBaseUrl }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${apiBaseUrl}/weight_cost_express_correlation`;
        const response = await fetch(url);
        const result = await response.json();

        if (response.ok) {
          const cleanData = result.filter(d => d.WeightKG != null && d.CostUSD != null);
          console.log(`Number of scatter points to be displayed: ${cleanData.length}`);

          setData(cleanData);

        } else {
          setError(result.error || 'Failed to fetch correlation data.');
          setData([]);
        }
      } catch (error) {
        console.error('Failed to fetch weight-cost correlation data:', error);
        setError('Failed to fetch correlation data. Is the backend running?');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiBaseUrl]);

  if (loading) {
     if (loading) {
        return (
            <div>
                <div id="filterControls">
                    <p id="loadingText">Loading Correlation Data...</p>
                </div>

            </div>
        );
    }

  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!data || data.length === 0) {
    return <p>No Express correlation data available.</p>;
  }

  // --- Start of Linear Regression Calculation ---
  const calculateLinearRegressionLine = (data) => {
    const validData = data.filter(point =>
      typeof point.WeightKG === 'number' && !isNaN(point.WeightKG) &&
      typeof point.CostUSD === 'number' && !isNaN(point.CostUSD)
    );

    if (validData.length < 2) return [];

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    const n = validData.length;

    validData.forEach(point => {
      const x = point.WeightKG;
      const y = point.CostUSD;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = (n * sumX2) - (sumX * sumX);

    if (denominator === 0) {
      return [];
    }

    const slope = numerator / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const minWeight = Math.min(...validData.map(d => d.WeightKG));
    const maxWeight = Math.max(...validData.map(d => d.WeightKG));

    const lineData = [
      { WeightKG: minWeight, CostUSD: slope * minWeight + intercept },
      { WeightKG: maxWeight, CostUSD: slope * maxWeight + intercept }
    ];

    return lineData;
  };

  const regressionLineData = calculateLinearRegressionLine(data);

  const allYValues = [
    ...data.map(d => d.CostUSD),
    ...(regressionLineData.length > 0 ? regressionLineData.map(d => d.CostUSD) : [])
  ].filter(val => typeof val === 'number' && !isNaN(val));

  const maxY = allYValues.length > 0 ? Math.max(...allYValues) : 100000;

  const yDomainMin = 0;
  const yDomainMaxFixed = Math.ceil(maxY / 100000) * 100000;

  const yTicks = [];
  for (let i = yDomainMin; i <= yDomainMaxFixed; i += 100000) {
    yTicks.push(i);
  }

  const xDomain = [0, 1000];
  const xTicks = [0, 200, 400, 600, 800, 1000];

  return (
    <div>
    <section>
      <div id="mainContentContainer">
      <h2 style={{ color: '#a5a1a1'}}>Correlation between Weight and Cost for Express Service Type</h2>
      <div style={{ width: '100%', height: '450px', display: 'flex', flexDirection: 'column' }}>
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
            <XAxis
              type="number"
              dataKey="WeightKG"
              name="Weight"
              unit=" kg"
              domain={xDomain}
              ticks={xTicks}
            />
            <YAxis
              type="number"
              dataKey="CostUSD"
              name="Cost"
              unit=" $"
              domain={[yDomainMin, yDomainMaxFixed]}
              ticks={yTicks}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name) => {
                if (name === 'Weight') return `${value} kg`;
                if (name === 'Cost') return `$${value.toFixed(2)}`;
                return value;
              }}
            />
            <Legend />
            <Scatter name="Express Shipments" data={data} fill="#e55c52" />
            {regressionLineData.length > 0 && (
              <Line
                dataKey="CostUSD"
                data={regressionLineData}
                type="linear"
                stroke="#24ea0e"
                strokeWidth={5}
                dot={false}
                activeDot={false}
                name="Regression Line"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      </div>
    </section>
    </div>
  );
}

export default WeightCostPage;
