import React from 'react';
import './Styles/Navigation.css';

// File for handling the navigation bar
function Navigation({ setCurrentPage }) {
    // The page identifiers here must exactly match the case statements in App.js.
    const navItems = [
        { name: 'Overview', page: 'homepage' },
        { name: 'Shipments Table', page: 'shipments' },
        { name: 'Distribution of Priority by Status', page: 'priority' },
        { name: 'Weight-Cost Correlation', page: 'weightcost' },
    ];

    return (
        <nav>
            <ul className="navigation-list">
                {navItems.map(item => (
                    <li key={item.page}>
                        <button
                            onClick={() => setCurrentPage(item.page)}
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
