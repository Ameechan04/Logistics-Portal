import React from 'react';

function Navigation({ setCurrentPage }) {
    const navItems = [
        { name: 'Overview', page: 'home' },
        { name: 'Shipments Table', page: 'shipments' },
        { name: 'Priority Distribution', page: 'priority' },
        { name: 'Weight-Cost Correlation', page: 'weight_cost' },
    ];

    return (
        <nav className="bg-white p-4 rounded-lg shadow-md mb-8">
            <ul className="flex flex-wrap justify-center gap-4">
                {navItems.map(item => (
                    <li key={item.page}>
                        <button
                            onClick={() => setCurrentPage(item.page)}
                            className="px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                        >
                            {item.name}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default Navigation;
