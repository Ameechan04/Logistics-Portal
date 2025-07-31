// frontend/src/Navigation.js
import React from 'react';
import './Styles/Navigation.css'; // Uncomment this if you create Navigation.css

// File for handling the navigation bar
function Navigation({ setCurrentPage }) {
    const navItems = [
        { name: 'Overview', page: 'home' },
        { name: 'Shipments Table', page: 'shipments' },
        { name: 'Priority Distribution', page: 'priority' },
        { name: 'Weight-Cost Correlation', page: 'weight_cost' },
    ];

    return (
        <nav> {/* You can remove the Tailwind classes from nav if you want */}
            <ul className="navigation-list"> {/* Apply the custom class here */}
                {navItems.map(item => (
                    <li key={item.page}>
                        <button
                            onClick={() => setCurrentPage(item.page)}
                            // You can remove existing Tailwind classes here if you want to style purely with custom CSS
                            // className="px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
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