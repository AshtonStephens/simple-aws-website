# Server Lambda

## Cheat sheet

* `poetry install`                 install dependenceis
* `poetry run pylint src tests`    lint the code
* `poetry run pytest`              perform tests
* `poetry cache clear --all .`     clear all python caches under the current directory.

---

## Introduction

AWS Lambda is a serverless compute service that allows us to run code without provisioning or managing servers. Lambda
will automatically scale our code based on demand, so we only pay for the compute time we use. This makes it ideal for
our event-driven microservice.

### Some of the benefits of using AWS Lambda:
- **Serverless:** We don't need to provision or manage servers. Lambda will automatically scale our code based on
    demand, so we only pay for the compute time we use.
- **Cost-effective:** Lambda is a pay-per-use service, so we only pay for the compute time we use. This can save us
    money on infrastructure costs.
- **Scalable:** Lambda is a highly scalable service that can handle spikes in traffic without any problems.
- **Secure:** Lambda is a secure service that uses Amazon Web Services' infrastructure to protect our code and data.
- **Reliable:** Lambda is a reliable service that has a 99.9% uptime SLA.

## Design

The python lambda handler uses the `EventHandler` class with the `handle` function as the lambda
entrypoint. When uploaded, the official lambda entry point is just the non-class `handler` function
defined at the top level.

To add additional API call support, adjust the code to handle the new syntax in the `EventHandler.handle` function.

**Note**: While you can handle any new event by adding it to the lambda, API gateway won't route
api calls to the lambda if it doesn't recognize them - so the api definition needs to be updated in
order to support new calls.

```python
    class EventHandler:
        ...
        def handle(self, event, context):
            ...
                if event['resource'] == "/newPath": # Example new path
                    if event['httpMethod'] == "POST": # Example new method to support
```

We have set up API Gateway routes request immediately to our lambda event handler, so our lambda
is also responsible for handling any CORS headers or other such business.

#### Some additional resources:

- [Using AWS Lambda with API Gateway](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html)
- [Example event object from AWS](https://github.com/awsdocs/aws-lambda-developer-guide/blob/main/sample-apps/nodejs-apig/event.json)

## Getting Started

### Prerequisites

To get started with this project, you will need to have the following items setup:

1. Python Poetry 1.5.1 installed ([installation instructions](https://python-poetry.org/docs/))

## Development Process

To locally build the application you'll need to run the following commands with the project subdirectory that contains
this readme file.

    poetry install # Install any required packages and the correct python locally.

To lint and test the code, run the following:

    poetry run pylint src tests # Run linter
    poetry run pytest # Run tests

---

### Adding New API Call Support

The Python lambda handles the events from the class defined in `entrypoint.py` called `EventHandler` and handlew events
through the method `handle`. To handle a new API call, you'll need to update that function in include unique responses
for the new resource path that you want to support.

***TODO: Add more details.***