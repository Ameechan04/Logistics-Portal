# Flask API Deployment Details
This section outlines the backend API, which is built with Flask, Flask-SocketIO for real-time communication, and Flask-CORS to handle cross-origin requests from the front-end.

## Base URL: [http://localhost:5000/api]

## API Endpoints:
All endpoints listed below return JSON data.


### 1. `GET /api/test`

Description: A simple check endpoint to ensure the API is running.

Response: {"message": "Test - returned from Flask API"}

### 2. `GET /api/dashboard_summary?carrier=[carrier]&status=[status]&serviceType=[service]`

Description: Fetches all dashboard summary data, including total shipments, delayed shipments, and costs, with optional filters.

Parameters: carrier, status, serviceType (all are optional).

Response:

{
  "totalShipments": 1000,
  "totalDelayedShipments": 50,
  "ordersPast3Months": 250,
  "delayedPast3Months": 15,
  "avgCostByCarrierData": [
    { "carrier": "FedEx", "averageCost": 45.25 },
    { "carrier": "UPS", "averageCost": 52.80 }
  ],
  "top5ExpensiveShipments": [
    { "id": "...", "CostUSD": 1500.00, ... }
  ]
}

### 3. `GET /api/average_shipment_by_carrier`

Description: Retrieves the average cost of shipments grouped by carrier, with optional filters.

Parameters: carrier, status, serviceType (all are optional).

Response:

[
  { "Carrier": "FedEx", "AverageCost": 45.25 },
  { "Carrier": "UPS", "AverageCost": 52.80 }
]

### 4. `GET /api/shipments?page=[page]&limit=[limit]&sortBy=[column]&sortOrder=[order]`

Description: A paginated endpoint to retrieve a list of shipments. Supports filtering and sorting.

Parameters: page, limit, sortBy, sortOrder, plus optional filters carrier, status, serviceType.

Response:

{
  "shipments": [
    { "id": "...", "ShipmentID": "...", "CostUSD": 45.50, ... }
  ],
  "totalCount": 5000
}

### 5. `GET /api/unique_carriers`

Description: Retrieves a distinct, sorted list of all carriers in the database.

Response: ["FedEx", "UPS", "USPS"]

### 6. `GET /api/priority_distribution_by_status`

Description: Returns the count of shipments for each combination of priority and delivery status.

Response:

[
  { "DeliveryStatus": "Delivered", "Priority": "High", "Count": 150 },
  { "DeliveryStatus": "Delayed", "Priority": "Medium", "Count": 30 }
]

### 7. `GET /api/weight_cost_express_correlation`

Description: Returns the weight and cost for all express shipments.

Response:

[
  { "WeightKG": 5.2, "CostUSD": 55.0 },
  { "WeightKG": 12.8, "CostUSD": 110.5 }
]

SocketIO Endpoints
The backend also includes a SocketIO server.

Namespace: /cosmos-db-nosql

Event: start - Initiates a background task on the server.

