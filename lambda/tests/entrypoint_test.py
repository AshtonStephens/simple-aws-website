"""
Unit test module for the lambda event handler.
"""

import json
from unittest import TestCase, mock, main
from src.entrypoint import EventHandler

# Testing Constants
TEST_TABLE_NAME = "TestTableName"
TEST_UUID = "a4b90c1b-4b38-4fde-85de-601cbc3e54b8"
TEST_UUID_FACTORY = lambda: TEST_UUID  # pylint: disable=unnecessary-lambda-assignment
TEST_LAMBDA_CONTEXT = None
TEST_MESSAGE = "This is a test message."
EXPECTED_RESPONSE_HEADERS = {
    'Content-Type': "application/json",
    'Access-Control-Allow-Headers': "Content-Type",
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Methods': "OPTIONS,POST,GET",
}

class EventHandlerTest(TestCase):
    """
    Test cases for the `EventHandler` class.
    """

    @mock.patch('boto3.client')
    def test_post_message(self, mock_client):
        """
        Test that the post `handle` method can successfully put a message to the DynamoDB table.
        """

        # Arrange
        mock_client.put_item.return_value = None # Output value not used.
        event = {
            'resource': '/messages',
            'httpMethod': 'POST',
            'body': f'"{TEST_MESSAGE}"',
        }

        # Act
        event_handler = EventHandler(mock_client, TEST_TABLE_NAME, TEST_UUID_FACTORY)
        response = event_handler.handle(event, TEST_LAMBDA_CONTEXT)

        # Assert
        self.assertEqual(response, {
            'statusCode': 201,
            'headers': EXPECTED_RESPONSE_HEADERS,
            'body': json.dumps({
                'id': TEST_UUID,
                'message': TEST_MESSAGE,
            })
        })
        self.assertEqual(
            mock_client.put_item.call_args,
            mock.call(
                TableName=TEST_TABLE_NAME,
                Item={'id': {'S': TEST_UUID}, 'message': {'S': TEST_MESSAGE}}))


    @mock.patch('boto3.client')
    def test_get_messages(self, mock_client):
        """
        Test that the `handle` method can successfully get the number of messages in
        the DynamoDB table.
        """

        # Arrange
        test_message_count = 10
        mock_client.scan.return_value = {
            'Count': test_message_count,
        }
        event = {
            'resource': '/messages',
            'httpMethod': 'GET',
        }

        # Act
        event_handler = EventHandler(mock_client, TEST_TABLE_NAME, TEST_UUID_FACTORY)
        response = event_handler.handle(event, None)

        # Assert
        self.assertEqual(response, {
            'statusCode': 200,
            'headers': EXPECTED_RESPONSE_HEADERS,
            'body': json.dumps({
                'message_count': test_message_count,
            })
        })
        self.assertEqual(
            mock_client.scan.call_args,
            mock.call(TableName=TEST_TABLE_NAME, Select='COUNT'))

    @mock.patch('boto3.client')
    def test_get_message_by_id(self, mock_client):
        """
        Test that the `handle` method can successfully get a message from the DynamoDB table by ID.
        """

        # Arrange
        mock_client.get_item.return_value = {
            'Item': {
                'id': {'S': TEST_UUID},
                'message': {'S': TEST_MESSAGE},
            },
        }
        event = {
            'resource': '/messages/{message_id}',
            'httpMethod': 'GET',
            'pathParameters': {
                'message_id': TEST_UUID,
            },
        }

        # Act
        event_handler = EventHandler(mock_client, TEST_TABLE_NAME, TEST_UUID_FACTORY)
        response = event_handler.handle(event, None)

        # Assert
        self.assertEqual(response, {
            'statusCode': 200,
            'headers': EXPECTED_RESPONSE_HEADERS,
            'body': json.dumps({
                'id': TEST_UUID,
                'message': TEST_MESSAGE,
            })
        })
        self.assertEqual(
            mock_client.get_item.call_args,
            mock.call(
                TableName=TEST_TABLE_NAME,
                Key={'id': {'S': TEST_UUID}}))

    @mock.patch('boto3.client')
    def test_unrecognized_method(self, mock_client):
        """
        Test that the `handle` method handles unexpected api calls appropriately.
        """

        # Arrange
        test_method = "PUT"
        test_resource = "/messages"
        event = {
            'httpMethod': test_method,
            'resource': test_resource,
        }

        # Act
        event_handler = EventHandler(mock_client, TEST_TABLE_NAME, TEST_UUID_FACTORY)
        response = event_handler.handle(event, None)

        # Assert
        self.assertEqual(response, {
            'statusCode': 400,
            'headers': EXPECTED_RESPONSE_HEADERS,
            'body': json.dumps(
                f'Unsupported API Call: Method {test_method}, Resource {test_resource}.'),
        })

if __name__ == '__main__':
    # unit test main
    main()
    print("tests finished")
