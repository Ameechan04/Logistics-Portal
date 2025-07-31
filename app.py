import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS

from datetime import datetime, timedelta
from collections import defaultdict  # Import defaultdict for easier grouping

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


#todo add sample
def demo_task():
    print("Running a simulated background task (e.g., AI analysis)...")


# api endpoints

@app.route("/api/test")
def test():
    return jsonify({"message": "Test - returned from Flask API"})


@app.route("/")
def index():
    return jsonify({"index": "index page"})


# query endpoints

@app.route("/api/average_shipment_by_carrier")
def average_shipment_by_carrier():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    # sorted client side (below)
    query = "SELECT c.Carrier, c.CostUSD FROM c WHERE IS_DEFINED(c.Carrier) AND IS_DEFINED(c.CostUSD)"

    try:
        all_shipments_data = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))


        carrier_costs = defaultdict(lambda: {'total_cost': 0, 'count': 0})

        for item in all_shipments_data:
            carrier = item.get('Carrier')
            cost = item.get('CostUSD')

            # cost must be number (error prevention)
            if carrier and isinstance(cost, (int, float)):
                carrier_costs[carrier]['total_cost'] += cost
                carrier_costs[carrier]['count'] += 1

        results = []
        for carrier, data in carrier_costs.items():
            if data['count'] > 0:  # prevent division by zero
                results.append({
                    "Carrier": carrier,
                    "AverageCost": round(data['total_cost'] / data['count'], 2)  #rounded
                })
            else:
                results.append({
                    "Carrier": carrier,
                    "AverageCost": 0
                })

        # results sorted by carrier
        results.sort(key=lambda x: x['Carrier'])

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": f"Failed to query and process average shipment cost by carrier: {e}"}), 500


@app.route('/api/delayed_last_3_months')
def get_delayed_last_3_months():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "cosmos db not initialized. check configuration."}), 500

    # using 90 days as an approximation for 3 months
    three_months_ago = datetime.utcnow() - timedelta(days=90)
    three_months_ago_iso = three_months_ago.isoformat(timespec='seconds') + "Z"
    print(three_months_ago_iso) #debug
    query = f"select value count(1) from c where c.DeliveryStatus = 'Delayed' and c.ShipmentDate >= '{three_months_ago_iso}'"

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

    # using 90 days as an approximation for 3 months
    three_months_ago = datetime.utcnow() - timedelta(days=90)
    three_months_ago_iso = three_months_ago.isoformat(timespec='seconds') + "Z"
    query = f"select value count(1) from c where c.ShipmentDate >= '{three_months_ago_iso}'"

    try:
        count = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))[0]
        return jsonify({"count": count})
    except Exception as e:
        print(f"error querying shipments from the past 3 months: {e}")
        return jsonify({"error": f"failed to query shipments from the past 3 months: {e}"}), 500


#get unique carrier names
@app.route('/api/unique_carriers')
def get_unique_carriers():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "cosmos db not initialized. check configuration."}), 500

    # cosmos db query to get distinct carrier names
    # note: distinct on non-partition key properties can be expensive for large datasets
    query = "select distinct value c.Carrier from c where is_defined(c.Carrier)"

    try:
        carriers = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        # filter out any None or empty string values that might come from the db
        carriers = [c for c in carriers if c and isinstance(c, str)]
        carriers.sort() # sort alphabetically for the dropdown
        return jsonify(carriers)
    except Exception as e:
        print(f"error querying unique carriers: {e}")
        return jsonify({"error": f"failed to query unique carriers: {e}"}), 500



@app.route('/api/total_delayed')
def get_total_delayed():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    query = f"SELECT VALUE COUNT(1) FROM c WHERE c.DeliveryStatus = 'Delayed'"
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

    # This is the optimal query for 'Top 5 expensive'
    query = "SELECT TOP 5 * FROM c ORDER BY c.CostUSD DESC"
    try:
        items = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": f"Failed to query top 5 expensive shipments: {e}"}), 500


@app.route('/api/priority_distribution_by_status')
def get_priority_distribution_by_status():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    query = "SELECT c.DeliveryStatus, c.Priority FROM c WHERE IS_DEFINED(c.DeliveryStatus) AND IS_DEFINED(c.Priority)"

    try:
        all_shipments_data = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))

        # key = (DeliveryStatus, Priority)
        distribution_counts = defaultdict(int)

        for item in all_shipments_data:
            status = item.get('DeliveryStatus')
            priority = item.get('Priority')

            if status and priority:  #if both present
                distribution_counts[(status, priority)] += 1

        # results formated into list of dictionaries
        results = []
        for (status, priority), count in distribution_counts.items():
            results.append({
                "DeliveryStatus": status,
                "Priority": priority,
                "Count": count
            })

        status_order = {
            "Delivered": 0,
            "Delayed": 1,
            "In Transit": 2,
            "Cancelled": 3
        }
        priority_order = {
            "High": 0,
            "Medium": 1,
            "Low": 2
        }

        # results sorted by delivery status then priority for each status
        results.sort(key=lambda x: (
            status_order.get(x['DeliveryStatus'], 99),  # first sort by status order
            priority_order.get(x['Priority'], 99)  # then by priority order
        ))
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": f"Failed to query and process priority distribution: {e}"}), 500


@app.route('/api/weight_cost_express_correlation')
def get_weight_cost_express_correlation():
    container = initialize_cosmos_db()
    if not container:
        return jsonify({"error": "Cosmos DB not initialized. Check configuration."}), 500

    query = "SELECT c.WeightKG, c.CostUSD FROM c WHERE c.ServiceType = 'Express'"
    try:
        items = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": f"Failed to query weight-cost correlation for Express: {e}"}), 500


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
    sort_order = request.args.get('sortOrder')  # 'asc' or 'desc'

    # build where clause
    where_clauses = []
    if carrier:
        where_clauses.append(f"c.Carrier = '{carrier}'")
    if status:
        where_clauses.append(f"c.DeliveryStatus = '{status}'")
    if service_type:
        where_clauses.append(f"c.ServiceType = '{service_type}'")

    where_string = ""
    if where_clauses:
        where_string = " WHERE " + " and ".join(where_clauses)

        # build order by clause
    order_by_string = ""
    if sort_by:
        # validate sort_by to prevent injection (simple check for allowed columns)
        # these must match the property names in your cosmos db documents
        allowed_sort_columns = [
            "ShipmentID", "Origin", "Destination", "Carrier", "DeliveryStatus",
            "ServiceType", "WeightKG", "CostUSD", "ShipmentDate", "DeliveryDate", "Priority"
        ]
        if sort_by in allowed_sort_columns:
            # default to ascending if sort_order is not 'desc'
            order_direction = "asc" if sort_order == "asc" else "desc"
            order_by_string = f" order by c.{sort_by} {order_direction}"
        else:
            # log or handle invalid sort_by column
            print(f"warning: invalid sort_by column requested: {sort_by}")

    # construct the full query
    query = f"select * from c{where_string}{order_by_string} offset {offset} limit {limit}"
    count_query = f"select value count(1) from c{where_string}"
    try:
        # fetch paginated shipments
        shipments = list(container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))

        # fetch total count
        total_count = list(container.query_items(
            query=count_query,
            enable_cross_partition_query=True
        ))[0]

        return jsonify({"shipments": shipments, "totalCount": total_count})
    except Exception as e:
        print(f"error querying shipments: {e}")
        return jsonify({"error": f"failed to query shipments: {e}"}), 500

#socket events:

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
    socketio.start_background_task(target=demo_task())


# --- Main Run Block ---
if __name__ == "__main__":
    socketio.run(
        app,
        port=int(os.getenv("PORT", default=5000)),
        debug=os.getenv("FLASK_DEBUG", default="True").lower() == "true",
        allow_unsafe_werkzeug=True
    )