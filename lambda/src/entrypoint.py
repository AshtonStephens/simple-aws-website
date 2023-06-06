"""
This module contains a Lambda function that handles requests to the `/messages` endpoint.

We use the `EventHandler` class to handle the requests. The `EventHandler` class
uses the `DynamoDB` client to store and retrieve messages.

The lambda function is invoked in prod by the `handler` function. The `handler` function will
instantiate the aws resources required for interacting with DynamoDB and will get the table name
from the environment variables when it constructs the `EventHandler` class in the actual lambda.
"""

import uuid
import json
import os
import boto3

class EventHandler:
    """
    Lambda handler class that handles requests to the `/messages` endpoint.
    """

    def __init__(self, client, table_name, uuid_factory):
        """
            Constructor for the event handler class.

            Args:
                client: The DynamoDB client.
                table_name: The name of the DynamoDB table.
                uuid_factory: The function that generates unique message ids.

            Returns:
                An instantiated EventHandler class.
        """
        self.client = client
        self.table_name = table_name
        self.uuid_factory = uuid_factory

    def handle(self, event, context): # pylint: disable=unused-argument
        """
        Lambda handler function that handles requests to the `/messages` endpoint.

        **Args:**

        * `event`: The event object that was passed to the Lambda function.
        * `context`: The context object that was passed to the Lambda function.

        **Returns:**

        A response object that contains the status code and body of the response.
        """
        try:
            if event['resource'] == "/messages":
                if event['httpMethod'] == "POST":

                    # Trim either side of the body if the message is encompassed by quotes.
                    # If the user wants to include quotes on either side then they will need
                    # to double up on quotes.
                    message = event['body']
                    if message[0] == '"' and message[-1] == '"':
                        message = message[1:-1]

                    # Create a message resource with a new unique id.
                    message_resource = {
                        'id': str(self.uuid_factory()),
                        'message': message,
                    }

                    # Package as dynamo db item.
                    message_dynamodb_item = {
                        'id': {'S': message_resource['id']},
                        'message': {'S': message_resource['message']},
                    }

                    # Put the message in DynamoDB.
                    self.client.put_item(TableName=self.table_name, Item=message_dynamodb_item)

                    # Respond to the API call with a successful status code and an instance of
                    # the created resource.
                    return package_response(201, message_resource)

                if event['httpMethod'] == "GET":

                    # Get the total number of messages in the DynamoDB table.
                    message_count = self.client.scan(
                        TableName=self.table_name,
                        Select='COUNT')['Count']

                    # Respond to the API call with a successful status code and the total number
                    # of messages.
                    return package_response(200, {"message_count": message_count})

            if event['resource'] == "/messages/{message_id}":
                if event['httpMethod'] == "GET":

                    # Query DynamoDB for the provided message id.
                    response = self.client.get_item(
                        TableName=self.table_name,
                        Key={'id': {'S': event['pathParameters']['message_id']}}
                    )

                    # Package the response as a message resource.
                    message_resource = {
                        'id': response['Item']['id']['S'],
                        'message': response['Item']['message']['S'],
                    }

                    # Respond to the API call with a successful status code.
                    return package_response(200, message_resource)


            raise NotImplementedError(
                f"Unsupported API Call: Method {event['httpMethod']}, " +
                f"Resource {event['resource']}.")

        except Exception as exception: # pylint: disable=broad-except
            # TODO: Include more robust error handling and more useful messages.
            return package_response(400, str(exception))


def handler(event, context):
    """
    Invokes the `EventHandler` class to handle a request to the `/messages` endpoint.

    **Args:**

    * `event`: The event object that was passed to the Lambda function.
    * `context`: The context object that was passed to the Lambda function.

    **Returns:**

    A response object that contains the status code and body of the response.
    """

    # Get the DynamoDB client.
    client = boto3.client('dynamodb')

    # Get the table name from the environment variable provided to the lambda via cloud formation.
    table_name = os.environ['MESSAGE_TABLE_NAME']

    # Construct the event handler with the lambda variables.
    return EventHandler(client, table_name, uuid.uuid4).handle(event, context)


def package_response(status_code: int, response_object):
    """
    Packages a response object.

    **Args:**

    * `status_code`: The status code of the response.
    * `response_object`: The object that will be the body of the response.

    **Returns:**

    A response object that contains the status code, headers, and body of the response.
    """

    # Create the response object with headers.
    response = {
        'statusCode': status_code,
        'headers': {
            'Content-Type': "application/json",
            # Add CORS headers to response.
            'Access-Control-Allow-Headers': "Content-Type",
            'Access-Control-Allow-Origin': "*", # Allow all origins.
            'Access-Control-Allow-Methods': "OPTIONS,POST,GET",
        },
    }

    # Add the body to the response object if there is one.
    if response_object is not None:
        response["body"] = json.dumps(response_object)

    # Return the response object.
    return response
