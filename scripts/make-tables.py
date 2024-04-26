#!/opt/homebrew/bin/python3
import boto3
import os
import uuid
import json
from decimal import Decimal
from time import sleep
from datetime import datetime

ENDPOINT_URL = None
ENDPOINT_URL = 'http://localhost:8000'
TEMPLATE_FILE = "./cloud_formation/cdk.out/CloudFormationStack.template.json"
TABLE_NAME = "DemoTable-276878302531-us-west-2-dev"
GSI_INDEX_NAME = "DemoTable-index-1"

with open(TEMPLATE_FILE) as fp:
  template = json.load(fp)
resources = template["Resources"]

class DateTimeEncoder(json.JSONEncoder):
  """Custom encoder for datetime objects."""
  def default(self, obj):
    if isinstance(obj, datetime):
      # Format datetime object to ISO 8601 string
      return obj.isoformat()
    elif isinstance(obj, Decimal):
        # Convert Decimal to a string to avoid losing precision
        return str(obj)
    elif isinstance(obj, uuid.UUID):
        # Convert UUID to string
        return str(obj)
    # Let the base class default method raise the TypeError
    return json.JSONEncoder.default(self, obj)


def print_response(data):
  return print(json.dumps(data, indent=2, cls=DateTimeEncoder))

# ------------------------------------------------------------------------
# Preprocessing
# ------------------------------------------------------------------------

# Get existing tables.
client = boto3.client('dynamodb', endpoint_url=ENDPOINT_URL)
list_tables_response = client.list_tables(Limit=10)
existing_tables = set(list_tables_response["TableNames"]) if "TableNames" in list_tables_response else set()

# Iterate through tables from the template.
tables = [resource for resource in resources.values() if resource["Type"] == "AWS::DynamoDB::Table"]
for table in tables:
  # Extract values
  properties = table["Properties"]
  table_name = properties["TableName"]

  if table_name not in existing_tables:
    # Make table if it's not present.
    client.create_table(**properties)
  else:
    # Don't make the table if it's already present.
    print(f"Table {table_name} already exists.")
    # TODO: Check if the relevant fields are equal, fail or prompt otherwise.


TABLE = boto3.resource("dynamodb", endpoint_url=ENDPOINT_URL).Table(TABLE_NAME)

# table_info = client.describe_table(TableName=TABLE_NAME)["Table"]
# print_response(table_info)

# ------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------

def add_item(item_data, table=TABLE):
  return table.put_item(Item=item_data)

def update_item(item_data, table=TABLE):
  response = table.update_item(
    Key={
      "txid": item_data["txid"],
      "outputIndex": item_data["outputIndex"]
    },
    UpdateExpression="SET opStatus = :opStatus, creationTime = :creationTime",
    ExpressionAttributeValues={  # Values for placeholders
      ":opStatus": item_data["opStatus"],
      ":creationTime": item_data["creationTime"],
    },
  )
  return response

def new_item(i=0):
  return {
    "txid": str(uuid.uuid4()),
    "outputIndex": 0,
    "opStatus": 1,
    "creationTime": 5231 + i,
    "recipient": str(uuid.uuid4()),
    "amount": 1632,
  }

def banner(title):
  print("-" * 80)
  print(title)
  print("-" * 80)
  print()

items = []
for i in range(50):
  item = new_item(i)
  items.append(item)
  response = add_item(item)
  if i == 32:
    print_response(item)
    print_response(response)

banner("Finished Creating Items")

table_info = client.describe_table(TableName=TABLE_NAME)["Table"]
print_response(table_info)

banner("Starting item update")

for item in items[24:30]:
  item["opStatus"] = 3
  update_item(item)

def query_gsi(status, table=TABLE, index_name=GSI_INDEX_NAME):
  print("querying gsi")
  query_args = {
    "IndexName": index_name,
    "KeyConditionExpression": "opStatus = :opStatus",
    "ExpressionAttributeValues": {":opStatus": status },
    "ScanIndexForward": False
  }
  response = table.query(**query_args)
  print_response(response)

banner("Finished Updating Items")
query_gsi(3)