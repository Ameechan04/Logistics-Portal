# Cosmos DB Schema Setup

Database Name: starlinksdb
Container Name: ClogisticsContainer
Partition Key: /ShipmentID

## Sample Document Schema
A document represents a single shipment with the following fields and data types.

{
  "id": "A1B2C3D4-E5F6-7G8H-9I0J-K1L2M3N4O5P6",
  "ShipmentID": "A1B2C3D4-E5F6-7G8H-9I0J-K1L2M3N4O5P6",
  "Origin": "string",
  "Destination": "string",
  "Carrier": "string",
  "DeliveryStatus": "string",
  "ServiceType": "string",
  "WeightKG": "number",
  "CostUSD": "number",
  "ShipmentDate": "string (ISO 8601 datetime)",
  "DeliveryDate": "string (ISO 8601 datetime)",
  "Priority": "string"
}

## Setup Steps
To replicate the database, follow these steps:

1. Create a new Azure Cosmos DB account.

2. Create a new database with the name specified in your COSMOS_DB_DATABASE_ID environment variable.

3. Within that database, create a new container with the name specified in your COSMOS_DB_CONTAINER_ID environment variable.

4. Set the Partition Key for this container to /ShipmentID.

5. Populate the container with sample data (run import_data.py with the csv file path set to specific path of CSV chosen).
