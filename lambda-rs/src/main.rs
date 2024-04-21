// External crates and their use in this application.
use aws_lambda_events::apigw::{ApiGatewayProxyRequest, ApiGatewayProxyResponse};
use aws_lambda_events::encodings::Body;
use http::{header, HeaderValue};
use lambda_runtime::{service_fn, Error, LambdaEvent};
use std::env;
use aws_config::BehaviorVersion;
use aws_sdk_dynamodb::Client;
use aws_sdk_dynamodb::types::{ AttributeValue, Select };
use serde_json::json;
use http::{HeaderMap, Method};
use uuid::Uuid;

/// Struct to wrap standard API Responses.
struct CustomApiResponse {
    status_code: i64,
    body: Option<Body>,
}

impl CustomApiResponse {

    /// Creates a standard successful API Response.
    pub fn success(status_code: i64, body: Option<Body>) -> CustomApiResponse {
        CustomApiResponse {
            status_code,
            body: body,
        }
    }

    /// Creates a standard unsuccessful API Response.
    pub fn fail(status_code: i64, message: String) -> CustomApiResponse {
        CustomApiResponse {
            status_code,
            body: Some(Body::Text(json!({ "message": message }).to_string()))
        }
    }

    /// Converts the CustomApiResponse into the ApiGatewayProxyResponse that the
    /// lambda must return.
    fn to_apigw_response(&self) -> Result<ApiGatewayProxyResponse, Error> {
        let mut headers = HeaderMap::new();
        headers.insert(header::CONTENT_TYPE, HeaderValue::from_static("application/json"));
        headers.insert(header::ACCESS_CONTROL_ALLOW_HEADERS, HeaderValue::from_static("Content-Type"));
        headers.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, HeaderValue::from_static("*"));
        headers.insert(header::ACCESS_CONTROL_ALLOW_METHODS, HeaderValue::from_static("OPTIONS,POST,GET"));
        Ok(ApiGatewayProxyResponse {
            status_code: self.status_code,
            multi_value_headers: headers.clone(),
            is_base64_encoded: false,
            body: self.body.clone(),
            headers,
        })
    }
}

/// Struct to handle Lambda events.
struct LambdaHandler {
    client: Client,
    table_name: String,
}

impl LambdaHandler {
    async fn handle_event(
        &self,
        event: LambdaEvent<ApiGatewayProxyRequest>
    ) -> Result<ApiGatewayProxyResponse, Error> {

        // TODO: Refactor event handler return value
        //
        // The main event handler function `_handle_event` should return a Result
        // and that result should be unwrapped into an API response.
        self._handle_event(event)
            .await?
            .to_apigw_response()
    }

    /// Asynchronously handles incoming API Gateway events and dispatches them
    /// to the correct method based on the route and method.
    ///
    /// # Arguments
    /// * `event` - A LambdaEvent containing the ApiGatewayProxyRequest.
    ///
    /// # Returns
    /// A result containing the API Gateway Proxy Response or an error.
    async fn _handle_event(
        &self,
        event: LambdaEvent<ApiGatewayProxyRequest>
    ) -> Result<CustomApiResponse, Error> {

        // Extract base data.
        let resource = event.payload.resource.unwrap_or_default();
        let http_method = event.payload.http_method;

        match (resource.as_str(), http_method) {
            ("/messages", Method::POST) => {

                // Generate UUID for the message we'll create.
                let message_id = Uuid::new_v4().to_string();

                // Trim the surrounding quotes from the message body if present.
                let mut message = event.payload.body.unwrap();
                if message.starts_with('"') && message.ends_with('"') {
                    message = message[1..message.len() - 1].to_string();
                }

                // Insert the message into the DynamoDB table and construct a JSON response.
                let resp = self.client
                    .put_item()
                    .table_name(&self.table_name)
                    .item("id", AttributeValue::S(message_id.clone()))
                    .item("message", AttributeValue::S(message.clone()))
                    .send()
                    .await;

                // Respond based on the DynamoDB response.
                match resp {
                    Ok(_) => {
                        let message_resource = json!({
                            "id": message_id,
                            "message": message
                        }).to_string();

                        Ok(CustomApiResponse::success(
                            201,
                            Some(Body::Text(message_resource)),
                        ))
                    },
                    Err(_) => {
                        Ok(CustomApiResponse::fail(
                            500,
                            "Failed creating resource.".to_string()
                        ))
                    }
                }
            }
            ("/messages", Method::GET) => {

                // Scan the table to get the number of entries.
                let resp = self.client.scan()
                    .table_name(&self.table_name)
                    .select(Select::Count)
                    .send()
                    .await;

                // Respond based on the DynamoDB response.
                match resp {
                    Ok(response) => {
                        let message_count = json!({
                            "message_count": response.count
                        }).to_string();

                        Ok(CustomApiResponse::success(
                            200,
                            Some(Body::Text(message_count))
                        ))
                    },
                    Err(_) => {
                        Ok(CustomApiResponse::fail(
                            400,
                            "Failed getting finding message count".to_string()
                        ))
                    }
                }
            }
            ("/messages/{message_id}", Method::GET) => {

                // Get message id from resource path.
                let message_id = event.payload.path_parameters.get("message_id").unwrap();

                // Query DynamoDB table for requested message.
                let resp = self.client
                    .get_item()
                    .table_name(&self.table_name)
                    .key("id", AttributeValue::S(message_id.clone()))
                    .send()
                    .await?;

                // Respond based on the DynamoDB response.
                match resp.item() {
                    // Respond with the message resource if present.
                    Some(message) => {
                        // TODO: Handle errors that would occur if the `unwrap` fails.
                        let message_resource = json!({
                            "id": message.get("id").unwrap().as_s().unwrap(),
                            "message": message.get("message").unwrap().as_s().unwrap(),
                        }).to_string();
                        Ok(CustomApiResponse::success(
                            200,
                            Some(Body::Text(message_resource))
                        ))
                    },
                    // Respond with 404 error if not found.
                    None => {
                        Ok(CustomApiResponse::fail(
                            404,
                            format!("Message {} not found.", message_id).to_string()
                        ))
                    }
                }
            }
            _ => Err("Unsupported API call".into()),
        }
    }
}

/// Main entry point for the AWS Lambda function.
#[tokio::main]
async fn main() -> Result<(), Error> {

    let is_local: bool = env::var("IS_LOCAL")? == "true";
    let table_name = env::var("MESSAGE_TABLE_NAME")?;

    // Configuration for AWS SDK, adjusting for local testing if necessary.
    let mut config = aws_config::load_defaults(BehaviorVersion::latest()).await;
    if is_local {
        config = config.into_builder()
            .endpoint_url("http://dynamodb:8000")
            .build();
    }

    // Create client and event handler.
    let client = Client::new(&config);
    let handler = LambdaHandler { client, table_name };

    // Run the lambda service.
    lambda_runtime::run(
        service_fn(
            |event: LambdaEvent<ApiGatewayProxyRequest>| handler.handle_event(event)
        )
    ).await
}