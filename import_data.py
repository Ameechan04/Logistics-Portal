import csv
import os
import time
from datetime import datetime
from azure.cosmos import CosmosClient, PartitionKey
COSMOS_DB_ENDPOINT = os.getenv("COSMOS_DB_ENDPOINT")
COSMOS_DB_KEY = os.getenv("COSMOS_DB_KEY")
COSMOS_DB_DATABASE_ID = os.getenv("COSMOS_DB_DATABASE_ID")
COSMOS_DB_CONTAINER_ID = os.getenv("COSMOS_DB_CONTAINER_ID")

COSMOS_DB_PARTITION_KEY_PATH = "/ShipmentID"
cosmos_client = None
shipments_container = None
#initialising
try:
    client = CosmosClient(COSMOS_DB_ENDPOINT, credential=COSMOS_DB_KEY)
    database = client.get_database_client(COSMOS_DB_DATABASE_ID)
    container = database.get_container_client(COSMOS_DB_CONTAINER_ID)
    print(f"Successfully connected to Cosmos DB account: {COSMOS_DB_ENDPOINT}")
    print(f"Using database: {COSMOS_DB_DATABASE_ID}, container: {COSMOS_DB_CONTAINER_ID}")
except Exception as e:
    print(f"Error connecting to Cosmos DB: {e}")
    print("Please ensure COSMOS_DB_ENDPOINT and COSMOS_DB_KEY are correctly set.")
    exit()  #failed


# --- Import Function ---
def import_csv_to_cosmos(csv_file_path, container_client, batch_size=100):
    """
    Reads a CSV file, transforms data, and imports it into Cosmos DB in batches.
    """
    processed_count = 0
    skipped_count = 0
    items_to_create = []
    start_time = time.time()

    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            print(f"Starting import from {csv_file_path}...")

            for row_num, row in enumerate(reader):
                item_data = {}
                try:
                    # Type Conversion and Data Cleaning
                    # Ensure numeric fields are correctly converted to float
                    item_data['ShipmentID'] = row.get('ShipmentID')
                    if not item_data['ShipmentID']:
                        raise ValueError("ShipmentID is missing or empty.")

                    # Cosmos DB 'id' field must be a unique string.
                    # Use ShipmentID for this, it's also your partition key.
                    item_data['id'] = str(item_data['ShipmentID'])

                    item_data['Origin'] = row.get('Origin')
                    item_data['Destination'] = row.get('Destination')
                    item_data['WeightKG'] = float(row['WeightKG']) if row.get('WeightKG') else 0.0
                    item_data['DistanceKM'] = float(row['DistanceKM']) if row.get('DistanceKM') else 0.0
                    item_data['DeliveryStatus'] = row.get('DeliveryStatus')

                    # Convert dates to ISO 8601 string format, adding 'Z' for UTC
                    item_data['ShipmentDate'] = datetime.strptime(row['ShipmentDate'], '%Y-%m-%d').isoformat() + "Z" \
                        if row.get('ShipmentDate') else None
                    item_data['DeliveryDate'] = datetime.strptime(row['DeliveryDate'], '%Y-%m-%d').isoformat() + "Z" \
                        if row.get('DeliveryDate') else None

                    item_data['Carrier'] = row.get('Carrier')
                    item_data['CostUSD'] = float(row['CostUSD']) if row.get('CostUSD') else 0.0
                    item_data['ServiceType'] = row.get('ServiceType')
                    item_data['Priority'] = row.get('Priority')

                    # Add the partition key value directly to the item for clarity and consistency
                    # This is crucial for correct item routing
                    # item_data[COSMOS_DB_PARTITION_KEY_PATH.lstrip('/')] = item_data['ShipmentID']
                    # The SDK typically handles this if 'id' matches the partition key path,
                    # but explicit inclusion can sometimes help.
                    # For a partition key of /ShipmentID, the ShipmentID field needs to be present in the document.

                    items_to_create.append(item_data)
                    processed_count += 1

                    # Bulk insert when batch size is reached
                    if len(items_to_create) >= batch_size:
                        print(
                            f"Processing batch of {len(items_to_create)} items (total processed: {processed_count - len(items_to_create) + 1} - {processed_count})...")
                        for item in items_to_create:
                            container_client.create_item(body=item)  # create_item is good for this scale
                        items_to_create = []

                except ValueError as ve:
                    print(f"Skipping row {row_num + 1} due to data conversion error: {ve} - Row data: {row}")
                    skipped_count += 1
                except KeyError as ke:
                    print(f"Skipping row {row_num + 1} due to missing required column: {ke} - Row data: {row}")
                    skipped_count += 1
                except Exception as e:
                    print(f"Skipping row {row_num + 1} due to unexpected error: {e} - Row data: {row}")
                    skipped_count += 1

            # Insert any remaining items
            if items_to_create:
                print(
                    f"Processing final batch of {len(items_to_create)} items (total processed: {processed_count - len(items_to_create) + 1} - {processed_count})...")
                for item in items_to_create:
                    container_client.create_item(body=item)

            end_time = time.time()
            duration = end_time - start_time
            print("\n--- Import Summary ---")
            print(f"Total items processed successfully: {processed_count}")
            print(f"Total items skipped due to errors: {skipped_count}")
            print(f"Total duration: {duration:.2f} seconds")
            print("CSV data import complete!")

    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_file_path}. Please check the path.")
    except Exception as e:
        print(f"An unexpected error occurred during the overall import process: {e}")


if __name__ == "__main__":
    if not all([COSMOS_DB_ENDPOINT, COSMOS_DB_KEY]):
        print("ERROR: Please set COSMOS_DB_ENDPOINT and COSMOS_DB_KEY environment variables or replace placeholders.")
    else:
        import_csv_to_cosmos("CSV_FILE_PATH", container)