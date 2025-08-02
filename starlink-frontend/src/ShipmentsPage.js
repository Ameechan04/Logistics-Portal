import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Styles/Shipments.css';


function ShipmentsPage({ apiBaseUrl }) {
    // state for shipments table
    const [shipments, setShipments] = useState([]);
    const [totalShipments, setTotalShipments] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15); // default table items limit
    const [goToPageInput, setGoToPageInput] = useState('');
    const [uniqueCarriers, setUniqueCarriers] = useState([]);
    const [filters, setFilters] = useState({
        carrier: '',
        status: '',
        serviceType: '',
        sortBy: '',
        sortOrder: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // fetch shipments for table view
    const fetchShipments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                ...filters
            };
            const response = await axios.get(`${apiBaseUrl}/shipments`, { params });
            setShipments(response.data.shipments);
            setTotalShipments(response.data.totalCount);
        } catch (err) {
            console.error("error fetching shipments for table:", err);
            setError("failed to load shipment data for table. is backend running?");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, filters, apiBaseUrl]); // for useCallback

    //fetch unique carriers once
    useEffect(() => {
        const fetchUniqueCarriers = async () => {
            try {
                const response = await axios.get(`${apiBaseUrl}/unique_carriers`);
                setUniqueCarriers(response.data);
            } catch (err) {
                console.error("Error fetching unique carriers:", err);
            }
        };

        fetchUniqueCarriers();
    }, [apiBaseUrl]);

    // useeffect hook to trigger data fetching for shipments
    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    // filter and sort handlers
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => {
            const newFilters = {
                ...prevFilters,
                [name]: value === 'All' ? '' : value
            };

            if (name === 'sortBy' && value !== '' && newFilters.sortOrder === '') {
                newFilters.sortOrder = 'desc';
            }
            if (name === 'sortBy' && value === '') {
                newFilters.sortOrder = '';
            }

            return newFilters;
        });
        setCurrentPage(1); // reset to first page on filter/sort change
    };

    const totalPages = Math.ceil(totalShipments / itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            setGoToPageInput('');
        }
    };

    const handleGoToPageChange = (e) => {
        setGoToPageInput(e.target.value);
    };

    const handleGoToPageSubmit = (e) => {
        if (e.key === 'Enter') {
            const pageNum = parseInt(goToPageInput, 10);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                handlePageChange(pageNum);
            } else {
                alert(`please enter a valid page number between 1 and ${totalPages}`); // use a custom modal in production
                setGoToPageInput(''); // clear invalid input
            }
        }
    };

    // pagination page number logic (must be after totalpages is calculated)
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5; // number of page buttons to show around the current page
        const ellipsisThreshold = 2; // how close to the start/end before showing ellipsis

        if (totalPages <= maxPagesToShow + ellipsisThreshold * 2) {
            // if total pages are few, show all
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // always show first page
            pageNumbers.push(1);

            // determine start and end of the visible range around currentpage
            let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxPagesToShow / 2));

            // adjust range if it extends too close to start/end
            if (currentPage - 1 <= ellipsisThreshold) { // close to start, extend end
                endPage = maxPagesToShow;
            }
            if (totalPages - currentPage <= ellipsisThreshold) { // close to end, extend start
                startPage = totalPages - maxPagesToShow + 1;
            }

            // add first ellipsis if needed
            if (startPage > 2) {
                pageNumbers.push('...');
            }

            // add pages in the calculated range
            for (let i = startPage; i <= endPage; i++) {
                if (i >= 1 && i <= totalPages) { // ensure page number is valid
                    pageNumbers.push(i);
                }
            }

            // add second ellipsis if needed
            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }

            // always show last page
            if (totalPages > 1) { // only add if more than 1 page
                pageNumbers.push(totalPages);
            }
        }
        // filter out duplicates if any (e.g., if totalpages is small and ellipsis logic overlaps)
        return [...new Set(pageNumbers)];
    };

    const displayedPageNumbers = getPageNumbers();


    if (loading) {
        return (
            <div>
                <div id="filterControls">
                    <p id="loadingText">Loading Shipments...</p>
                </div>

            </div>
        );
    }

    if (error) {
        return <p>error: {error}</p>;
    }

    return (
        <div>
            {/* filters and sorting section */}
            <div id="filterControls">
                    {/* 1. carrier filter */}
                    <div>
                        <label htmlFor="carrierFilter">carrier:</label>
                        <select
                            id="carrierFilter"
                            name="carrier"
                            value={filters.carrier}
                            onChange={handleFilterChange}
                        >
                            <option value="All">all carriers</option>
                          {/* dynamically render carrier options */}
                          {uniqueCarriers.map((carrierName) => (
                            <option key={carrierName} value={carrierName}>{carrierName}</option>
                          ))}
                        </select>
                    </div>

                    {/* 2. status filter */}
                    <div>
                        <label htmlFor="statusFilter">status:</label>
                        <select
                            id="statusFilter"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="All">all statuses</option>
                            <option value="Delivered">delivered</option>
                            <option value="In Transit">in transit</option>
                            <option value="Delayed">delayed</option>
                            <option value="Cancelled">cancelled</option>
                        </select>
                    </div>

                    {/* 3. service type filter */}
                    <div>
                        <label htmlFor="serviceTypeFilter">service type:</label>
                        <select
                            id="serviceTypeFilter"
                            name="serviceType"
                            value={filters.serviceType}
                            onChange={handleFilterChange}
                        >
                            <option value="All">all service types</option>
                            <option value="Standard">standard</option>
                            <option value="Express">express</option>
                            <option value="Same Day">same day</option>
                            <option value="Overnight">overnight</option>
                        </select>
                    </div>

                    {/* sort by options*/}
                    <div>
                        <label htmlFor="sortBy">sort by:</label>
                        <select
                            id="sortBy"
                            name="sortBy"
                            value={filters.sortBy}
                            onChange={handleFilterChange}
                        >
                            <option value="">none</option>
                            <option value="ShipmentID">shipment id</option>
                            <option value="Origin">origin</option>
                            <option value="Destination">destination</option>
                            <option value="Carrier">carrier</option>
                            <option value="DeliveryStatus">status</option>
                            <option value="ServiceType">service type</option>
                            <option value="WeightKG">weight (kg)</option>
                            <option value="CostUSD">cost (usd)</option>
                            <option value="ShipmentDate">shipment date</option>
                            <option value="DeliveryDate">delivery date</option>
                            <option value="Priority">priority</option>
                        </select>
                    </div>

                    {/* sort order */}
                    <div>
                        <label htmlFor="sortOrder">order:</label>
                        <select
                            id="sortOrder"
                            name="sortOrder"
                            value={filters.sortOrder}
                            onChange={handleFilterChange}
                        >
                            <option value="">none</option>
                            <option value="asc">ascending</option>
                            <option value="desc">descending</option>
                        </select>
                    </div>
            </div>

            {/* table view section */}
            <section>
                <div className="shipment-table-container">
                    <table>
                        <thead>
                        <tr>
                            <th scope="col">shipment id</th>
                            <th scope="col">origin</th>
                            <th scope="col">destination</th>
                            <th scope="col">carrier</th>
                            <th scope="col">status</th>
                            <th scope="col">service type</th>
                            <th scope="col">weight (kg)</th>
                            <th scope="col">cost (usd)</th>
                            <th scope="col">shipment date</th>
                            <th scope="col">delivery date</th>
                            <th scope="col">priority</th>
                        </tr>
                        </thead>
                        <tbody>
                        {shipments.map((shipment) => (
                            <tr key={shipment.ShipmentID}>
                                <td>{shipment.ShipmentID}</td>
                                <td>{shipment.Origin}</td>
                                <td>{shipment.Destination}</td>
                                <td>{shipment.Carrier}</td>
                                <td>{shipment.DeliveryStatus}</td>
                                <td>{shipment.ServiceType}</td>
                                <td>{shipment.WeightKG}</td>
                                <td>${shipment.CostUSD?.toFixed(2)}</td>
                                <td>{new Date(shipment.ShipmentDate).toLocaleDateString()}</td>
                                <td>
                                    {shipment.DeliveryDate
                                      ? new Date(shipment.DeliveryDate).toLocaleDateString()
                                      : 'N/A'}
                                </td>
                                <td>{shipment.Priority}</td>
                            </tr>
                        ))}
                        {shipments.length === 0 && !loading && (
                            <tr>
                                <td colSpan="11">no shipments found with current filters.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* page controls */}
                <nav>
                    <div>
                        {/* page info */}
                        <div id = "pageNumberSection">
                            showing <span>{(currentPage - 1) * itemsPerPage + 1}</span> to <span>{Math.min(currentPage * itemsPerPage, totalShipments)}</span> of{' '}
                            <span>{totalShipments}</span> results
                        </div>

                        {/* buttons for changing current page*/}
                        <div id="pageButtons">
                            {/* previous button (lhs) */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="arrowButtons"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                previous
                            </button>

                            {displayedPageNumbers.map((page, index) => (
                                page === '...' ? (
                                    <span key={index}>...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        aria-current={currentPage === page ? 'page' : undefined}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}

                            {/* next button (rhs)*/}
                            <button
                                className="arrowButtons"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                next
                            </button>
                        </div>

                        {/* go to page input */}
                        <div id = "pageInputSection">
                            <label htmlFor="goToPage">go to page</label>
                            <input
                                type="number"
                                id="goToPage"
                                value={goToPageInput}
                                onChange={handleGoToPageChange}
                                onKeyPress={handleGoToPageSubmit}
                                placeholder="go to page"
                                min="1"
                                max={totalPages}
                            />
                        </div>
                    </div>
                </nav>
            </section>
        </div>
    );
}

export default ShipmentsPage;
