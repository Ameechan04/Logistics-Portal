// frontend/src/HomePage.js
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// function HomePage({ totalShipments, totalDelayedShipments, avgCostByCarrierData, top5ExpensiveShipments }) {
function HomePage({ totalShipments, avgCostByCarrierData, top5ExpensiveShipments }) {
    const calculateOverallAverageCost = () => {
        if (!avgCostByCarrierData || avgCostByCarrierData.length === 0) return 'N/A';
        const totalCost = avgCostByCarrierData.reduce((sum, item) => sum + item.averageCost, 0);
        return `$${(totalCost / avgCostByCarrierData.length).toFixed(2)}`;
    };

    return (
        <div className="space-y-8">
            {/* Overview Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <h1>Homepage</h1>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-600">Total Shipments Handled</h3>
                    <p className="text-4xl font-bold text-blue-600">{totalShipments}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-600">Total Delayed Shipments</h3>
                    {/*<p className="text-4xl font-bold text-red-600">*/}
                    {/*    {totalDelayedShipments !== null ? totalDelayedShipments : 'N/A'}*/}
                    {/*</p>*/}
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-600">Overall Average Cost</h3>
                    <p className="text-4xl font-bold text-green-600">
                        {calculateOverallAverageCost()}
                    </p>
                </div>
            </section>

            {/* Charts for Homepage */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Average Cost by Carrier Chart */}
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

                {/* Top 5 Most Expensive Shipments Chart */}
                <div className="bg-white p-4 rounded-lg shadow-md h-96">
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
            </section>
        </div>
    );
}

export default HomePage;
