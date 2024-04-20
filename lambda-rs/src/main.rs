use aws_lambda_events::apigw::{ApiGatewayProxyRequest, ApiGatewayProxyResponse};
use http::HeaderMap;
use lambda_runtime::{service_fn, Error, LambdaEvent};

// To use the OpenAPI model import from the `openapi_rs` crate.
// use openapi_rs::models::{ GetMessages200Response, message_data };

// Using demo from https://docs.aws.amazon.com/lambda/latest/dg/rust-http-events.html

async fn handler(
    event: LambdaEvent<ApiGatewayProxyRequest>,
) -> Result<ApiGatewayProxyResponse, Error> {
    let mut headers = HeaderMap::new();
    headers.insert("content-type", "text/html".parse().unwrap());
    let resp = ApiGatewayProxyResponse {
        status_code: 200,
        multi_value_headers: headers.clone(),
        is_base64_encoded: false,
        body: Some(
            format!(
                "Hello AWS Lambda HTTP request at resource {}.",
                event.payload.path.unwrap(),
            ).into()),
        headers,
    };
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    lambda_runtime::run(service_fn(handler)).await
}