// frontend/src/HomePage.js
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function HomePage({ totalShipments, totalDelayedShipments, avgCostByCarrierData, top5ExpensiveShipments }) {
    const calculateOverallAverageCost = () => {
        if (!avgCostByCarrierData || avgCostByCarrierData.length === 0) return 'N/A';
        const totalCost = avgCostByCarrierData.reduce((sum, item) => sum + item.averageCost, 0);
        return `$${(totalCost / avgCostByCarrierData.length).toFixed(2)}`;
    };


    console.log('HomePage DEBUG: Received avgCostByCarrierData prop:', avgCostByCarrierData);
    console.log('HomePage DEBUG: avgCostByCarrierData length:', avgCostByCarrierData ? avgCostByCarrierData.length : 'N/A');

    return (
        <div className="space-y-8">
            {/* overview:  */}
            <section>
                <div>
                    <h3>Total Shipments Handled</h3>
                    <p>{totalShipments}</p>
                </div>
                <div>
                    <h3>Total Delayed Shipments</h3>
                    <p>
                        {totalDelayedShipments !== null ? totalDelayedShipments : 'N/A'}
                    </p>
                </div>
                <div>
                    <h3>Overall Average Cost</h3>
                    <p>
                        {calculateOverallAverageCost()}
                    </p>
                </div>
            </section>

            <section>
                {/* average cost by carrier */}
                <div>
                    <h2>Average Cost by Carrier</h2>
                    <div>
                        {avgCostByCarrierData && avgCostByCarrierData.length > 0 ? (
                            <ul>
                                {avgCostByCarrierData.map((item, index) => (
                                    <li key={index} className="text-gray-700">
                                        <span
                                            className="font-medium">{item.carrier}:</span> ${item.averageCost?.toFixed(2)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No average cost by carrier data available.</p>
                        )}
                    </div>
                </div>

                {/* top 5 expensive orders */}
                <div>
                    <h2>Top 5 Most Expensive Shipments</h2>
                    <div>
                        {top5ExpensiveShipments && top5ExpensiveShipments.length > 0 ? (
                            <ol>
                                {top5ExpensiveShipments.map((item) => (
                                    <li key={item.ShipmentID} className="text-gray-700">
                                        <span
                                            className="font-medium">{item.ShipmentID}:</span> ${item.CostUSD?.toFixed(2)} (Carrier: {item.Carrier})
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p>No top 5 expensive shipments data available.</p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;
