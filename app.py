# app.py
import os
from dotenv import load_dotenv

load_dotenv()

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS

from datetime import datetime, timedelta
from collections import defaultdict

# Azure Cosmos DB imports
from azure.cosmos import CosmosClient, PartitionKey

# --- Flask App Setup ---
app = Flask(__name__)

# --- CORS Configuration ---
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]}})

# --- Flask-SocketIO Configuration ---
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    transports=["websocket", "polling"],
    async_mode="threading"
)

# --- Cosmos DB Configuration ---
COSMOS_DB_ENDPOINT = os.getenv("COSMOS_DB_ENDPOINT")
COSMOS_DB_KEY = os.getenv("COSMOS_DB_KEY")
COSMOS_DB_DATABASE_ID = os.getenv("COSMOS_DB_DATABASE_ID")
COSMOS_DB_CONTAINER_ID = os.getenv("COSMOS_DB_CONTAINER_ID")

COSMOS_DB_PARTITION_KEY_PATH = "/ShipmentID"
cosmos_client = None
shipments_container = None


def initialize_cosmos_db():
    """Initializes the Cosmos DB client and container."""
    global cosmos_client, shipments_container
    if not cosmos_client:
        try:
            cosmos_client = CosmosClient(COSMOS_DB_ENDPOINT, credential=COSMOS_DB_KEY)
            database = cosmos_client.get_database_client(COSMOS_DB_DATABASE_ID)
            shipments_container = database.get_container_client(COSMOS_DB_CONTAINER_ID)
            print("Cosmos DB client initialized successfully.")
        except Exception as e:
            print(f"Error initializing Cosmos DB client: {e}")
            print("Please ensure COSMOS_DB_ENDPOINT and COSMOS_DB_KEY are correctly set and valid.")
            shipments_container = None
    return shipments_container


with app.app_context():
    initialize_cosmos_db()


def _build_where_clause(carrier, status, service_type):
    """
    Builds a list of WHERE clause strings based on filter parameters.
    This helper function no longer adds the 'WHERE' keyword.
    """
    where_clauses = []
    if carrier:
        where_clauses.append(f"c.Carrier = '{carrier}'")
    if status:
        where_clauses.append(f"c.DeliveryStatus = '{status}'")
    if service_type:
        where_clauses.append(f"c.ServiceType = '{service_type}'")
    return where_clauses


# --- API Endpoints ---

@app.route("/api/test")
def test():
    return jsonify({"message": "Test - returned from Flask API"})


@app.route("/")
def index():
    return jsonify({"index": "index page"})


@app.route("/api/dashboard_summary")
def get_dashboard_summary():
    """
    Unified endpoint to get all dashboard data with filters.
    Accepts: carrier, status, serviceType as query parameters.
    """
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    carrier = request.args.get('carrier')
    status = request.args.get('status')
    service_type = request.args.get('serviceType')

    where_clauses = _build_where_clause(carrier, status, service_type)
    # The fix is here: we join the list into a string.
    where_string = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    try:
        # Step 1: Fetch all data for the given filters in one go
        all_shipments_query = f"SELECT * FROM c{where_string}"
        all_shipments_data = list(container.query_items(
            query=all_shipments_query,
            enable_cross_partition_query=True
        ))

        # If no data found, return empty metrics
        if not all_shipments_data:
            return jsonify({
                "totalShipments": 0,
                "totalDelayedShipments": 0,
                "ordersPast3Months": 0,
                "delayedPast3Months": 0,
                "avgCostByCarrierData": [],
                "top5ExpensiveShipments": []
            })

        # Step 2: Calculate all metrics from the fetched data

        # a) Total shipments and total delayed
        total_shipments = len(all_shipments_data)
        total_delayed_shipments = sum(1 for item in all_shipments_data if item.get('DeliveryStatus') == 'Delayed')

        # b) Past 3 months metrics
        three_months_ago = datetime.utcnow() - timedelta(days=90)
        past_3_months_shipments = [
            item for item in all_shipments_data
            if item.get('ShipmentDate') and datetime.fromisoformat(item['ShipmentDate'].rstrip('Z')) >= three_months_ago
        ]
        orders_past_3_months = len(past_3_months_shipments)
        delayed_past_3_months = sum(1 for item in past_3_months_shipments if item.get('DeliveryStatus') == 'Delayed')

        # c) Average cost by carrier
        carrier_costs = defaultdict(lambda: {'total_cost': 0, 'count': 0})
        for item in all_shipments_data:
            carrier_name = item.get('Carrier')
            cost = item.get('CostUSD')
            if carrier_name and isinstance(cost, (int, float)):
                carrier_costs[carrier_name]['total_cost'] += cost
                carrier_costs[carrier_name]['count'] += 1
        avg_cost_by_carrier_data = [
            {"carrier": carrier_name, "averageCost": round(data['total_cost'] / data['count'], 2)}
            for carrier_name, data in carrier_costs.items() if data['count'] > 0
        ]

        # d) Top 5 expensive shipments
        top_5_expensive_shipments = sorted(all_shipments_data, key=lambda x: x.get('CostUSD', 0), reverse=True)[:5]

        # Return all data in one response
        return jsonify({
            "totalShipments": total_shipments,
            "totalDelayedShipments": total_delayed_shipments,
            "ordersPast3Months": orders_past_3_months,
            "delayedPast3Months": delayed_past_3_months,
            "avgCostByCarrierData": avg_cost_by_carrier_data,
            "top5ExpensiveShipments": top_5_expensive_shipments
        })

    except Exception as e:
        print(f"Error fetching dashboard summary: {e}")
        return jsonify({"error": f"Failed to query dashboard summary: {e}"}), 500


@app.route("/api/average_shipment_by_carrier")
def average_shipment_by_carrier():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    carrier = request.args.get('carrier')
    status = request.args.get('status')
    service_type = request.args.get('serviceType')
    where_clauses = _build_where_clause(carrier, status, service_type)
    # The fix is here: properly join the list and prefix 'WHERE'
    where_string = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # Correct the query to prevent a second WHERE clause
    query = f"SELECT c.Carrier, c.CostUSD FROM c{where_string} WHERE IS_DEFINED(c.Carrier) AND IS_DEFINED(c.CostUSD)"
    # The previous line had a bug. It would create a double WHERE.
    # The correct way is to add these conditions to the list before building the string.
    where_clauses.extend(["IS_DEFINED(c.Carrier)", "IS_DEFINED(c.CostUSD)"])
    where_string = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    query = f"SELECT c.Carrier, c.CostUSD FROM c{where_string}"

    try:
        all_shipments_data = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))

        carrier_costs = defaultdict(lambda: {'total_cost': 0, 'count': 0})
        for item in all_shipments_data:
            carrier_name = item.get('Carrier')
            cost = item.get('CostUSD')
            if carrier_name and isinstance(cost, (int, float)):
                carrier_costs[carrier_name]['total_cost'] += cost
                carrier_costs[carrier_name]['count'] += 1

        results = []
        for carrier_name, data in carrier_costs.items():
            if data['count'] > 0:
                results.append({
                    "Carrier": carrier_name,
                    "AverageCost": round(data['total_cost'] / data['count'], 2)
                })
            else:
                results.append({
                    "Carrier": carrier_name,
                    "AverageCost": 0
                })
        results.sort(key=lambda x: x['Carrier'])
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": f"Failed to query and process average shipment cost by carrier: {e}"}), 500


@app.route('/api/delayed_last_3_months')
def get_delayed_last_3_months():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "cosmos db not initialized. check configuration."}), 500

    carrier = request.args.get('carrier')
    status = request.args.get('status')
    service_type = request.args.get('serviceType')
    where_clauses = _build_where_clause(carrier, status, service_type)
    # The fix is here: append to the list, then join.
    where_clauses.append("c.DeliveryStatus = 'Delayed'")

    three_months_ago = datetime.utcnow() - timedelta(days=90)
    three_months_ago_iso = three_months_ago.isoformat(timespec='seconds') + "Z"
    where_clauses.append(f"c.ShipmentDate >= '{three_months_ago_iso}'")

    where_string = " WHERE " + " AND ".join(where_clauses)
    query = f"select value count(1) from c{where_string}"

    try:
        count = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))[0]
        return jsonify({"count": count})
    except Exception as e:
        print(f"error querying delayed shipments past 3 months: {e}")
        return jsonify({"error": f"failed to query delayed shipments past 3 months: {e}"}), 500


@app.route('/api/orders_last_3_months')
def get_orders_last_3_months():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "cosmos db not initialized. check configuration."}), 500

    carrier = request.args.get('carrier')
    status = request.args.get('status')
    service_type = request.args.get('serviceType')
    where_clauses = _build_where_clause(carrier, status, service_type)

    three_months_ago = datetime.utcnow() - timedelta(days=90)
    three_months_ago_iso = three_months_ago.isoformat(timespec='seconds') + "Z"
    where_clauses.append(f"c.ShipmentDate >= '{three_months_ago_iso}'")

    where_string = " WHERE " + " AND ".join(where_clauses)
    query = f"select value count(1) from c{where_string}"

    try:
        count = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))[0]
        return jsonify({"count": count})
    except Exception as e:
        print(f"error querying shipments from the past 3 months: {e}")
        return jsonify({"error": f"failed to query shipments from the past 3 months: {e}"}), 500


@app.route('/api/total_delayed')
def get_total_delayed():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    carrier = request.args.get('carrier')
    status = request.args.get('status')
    service_type = request.args.get('serviceType')
    where_clauses = _build_where_clause(carrier, status, service_type)
    # The fix is here: append to the list, then join.
    where_clauses.append("c.DeliveryStatus = 'Delayed'")
    where_string = " WHERE " + " AND ".join(where_clauses)

    query = f"SELECT VALUE COUNT(1) FROM c{where_string}"
    try:
        count = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))[0]
        return jsonify({"count": count})
    except Exception as e:
        return jsonify({"error": f"Failed to query delayed shipments: {e}"}), 500


@app.route('/api/top_5_expensive')
def get_top_5_expensive():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    carrier = request.args.get('carrier')
    status = request.args.get('status')
    service_type = request.args.get('serviceType')
    where_clauses = _build_where_clause(carrier, status, service_type)
    # The fix is here: join the list into a string
    where_string = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # This is the optimal query for 'Top 5 expensive'
    query = f"SELECT TOP 5 * FROM c{where_string} ORDER BY c.CostUSD DESC"
    try:
        items = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": f"Failed to query top 5 expensive shipments: {e}"}), 500


# Unmodified endpoints for uniqueness and table
@app.route('/api/unique_carriers')
def get_unique_carriers():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "cosmos db not initialized. check configuration."}), 500

    query = "select distinct value c.Carrier from c where is_defined(c.Carrier)"
    try:
        carriers = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        carriers = [c for c in carriers if c and isinstance(c, str)]
        carriers.sort()
        return jsonify(carriers)
    except Exception as e:
        print(f"error querying unique carriers: {e}")
        return jsonify({"error": f"failed to query unique carriers: {e}"}), 500


@app.route('/api/shipments')
def get_shipments_table():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    offset = (page - 1) * limit

    # get filter parameters
    carrier = request.args.get('carrier')
    status = request.args.get('status')
    service_type = request.args.get('serviceType')

    # get sort parameters from frontend request
    sort_by = request.args.get('sortBy')
    sort_order = request.args.get('sortOrder')

    # build where clause
    where_clauses = _build_where_clause(carrier, status, service_type)
    where_string = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # build order by clause
    order_by_string = ""
    if sort_by:
        allowed_sort_columns = [
            "ShipmentID", "Origin", "Destination", "Carrier", "DeliveryStatus",
            "ServiceType", "WeightKG", "CostUSD", "ShipmentDate", "DeliveryDate", "Priority"
        ]
        if sort_by in allowed_sort_columns:
            order_direction = "asc" if sort_order == "asc" else "desc"
            order_by_string = f" order by c.{sort_by} {order_direction}"
        else:
            print(f"warning: invalid sort_by column requested: {sort_by}")

    # construct the full query
    query = f"select * from c{where_string}{order_by_string} offset {offset} limit {limit}"
    count_query = f"select value count(1) from c{where_string}"
    try:
        shipments = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))

        total_count = list(container.query_items(
            query=count_query,
            enable_cross_partition_query=True
        ))[0]

        return jsonify({"shipments": shipments, "totalCount": total_count})
    except Exception as e:
        print(f"error querying shipments: {e}")
        return jsonify({"error": f"failed to query shipments: {e}"}), 500


@app.route('/api/priority_distribution_by_status')
def get_priority_distribution_by_status():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    carrier = request.args.get('carrier')
    status = request.args.get('status')
    service_type = request.args.get('serviceType')
    where_clauses = _build_where_clause(carrier, status, service_type)
    # The fix is here: append to the list, then join.
    where_clauses.extend(["IS_DEFINED(c.DeliveryStatus)", "IS_DEFINED(c.Priority)"])
    where_string = " WHERE " + " AND ".join(where_clauses)

    query = f"SELECT c.DeliveryStatus, c.Priority FROM c{where_string}"

    try:
        all_shipments_data = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))

        distribution_counts = defaultdict(int)
        for item in all_shipments_data:
            status_item = item.get('DeliveryStatus')
            priority = item.get('Priority')
            if status_item and priority:
                distribution_counts[(status_item, priority)] += 1

        results = []
        for (status_item, priority), count in distribution_counts.items():
            results.append({
                "DeliveryStatus": status_item,
                "Priority": priority,
                "Count": count
            })

        status_order = {
            "Delivered": 0, "Delayed": 1, "In Transit": 2, "Cancelled": 3
        }
        priority_order = {
            "High": 0, "Medium": 1, "Low": 2
        }

        results.sort(key=lambda x: (
            status_order.get(x['DeliveryStatus'], 99),
            priority_order.get(x['Priority'], 99)
        ))
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": f"Failed to query and process priority distribution: {e}"}), 500


@app.route('/api/weight_cost_express_correlation')
def get_weight_cost_express_correlation():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    carrier = request.args.get('carrier')
    status = request.args.get('status')
    service_type = request.args.get('serviceType')
    where_clauses = _build_where_clause(carrier, status, service_type)
    # The fix is here: append to the list, then join.
    where_clauses.append("c.ServiceType = 'Express'")
    where_string = " WHERE " + " AND ".join(where_clauses)

    query = f"SELECT c.WeightKG, c.CostUSD FROM c{where_string}"
    try:
        items = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": f"Failed to query weight-cost correlation for Express: {e}"}), 500


# --- Socket Events ---

@socketio.on('connect')
def test_connect():
    print('Client connected to default namespace')
    emit('my response', {'data': 'Connected to default namespace'})


@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected from default namespace')


@socketio.on("start", namespace="/cosmos-db-nosql")
def start_cosmos_demo(data):
    print(f"Received 'start' event with data: {data}")
    # Run a simulated background task (e.g., AI analysis)
    # The function call is now `demo_task` without `()` so it's passed as a reference
    socketio.start_background_task(target=demo_task)


def demo_task():
    print("Running a simulated background task...")


# --- Main Run Block ---
if __name__ == "__main__":
    socketio.run(
        app,
        port=int(os.getenv("PORT", default=5000)),
        debug=os.getenv("FLASK_DEBUG", default="True").lower() == "true",
        allow_unsafe_werkzeug=True
    )
