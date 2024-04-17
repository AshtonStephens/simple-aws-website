# Repository README
## Introduction

This repository contains all the source code and cloud deployment configurations required to fully deploy a server that can send and receive messages, and a website that interacts with it.

## Project Structure

The project is structured as a monorepo, with all the code and configuration files stored in the same directory. This makes it easy to manage and develop the project, as all the dependencies are already in place.

The project is divided into the following subdirectories:

- **cloud_formation:** Contains the AWS Cloud Formation templates used to deploy the server.
- **api_definition:** Contains the OpenAPI definition for the server's API.
- **lambda:** Contains the Python code for the Lambda function that handles the server's API requests.
- **website:** Contains the TypeScript and html code for the server's website.

## Backend
### Message REST API

* `/messages` - GET - Returns the total number of
* `/messages` - POST - Creates a message on the server
* `/messages/{message_id}` - GET - a message resource from the server

The message rest api handles posting, getting, and returning the count of messages.
A message resource looks as follows:

| Parameter | Type | Description | Example |
| :- | :-: | :- | :- |
| message | string | contents of the message | "hello"
| id | string | uuid of the message | "d17fdd83-da28-4b1b-97bf-8e0c572c80b5" |

### Cloud Resources

The API backend utilizes API Gateway as the api endpoint and manages all functionality
within an AWS lambda.

<img src="./assets/Message%20Website%20Diagram.png" width="500" height="auto">

This design has a few core benefits:

- **No infrastructure to manage:** Lambdas are serverless, which means that we don't need to worry about provisioning or managing servers.
- **Cost-effective:** Lambda functions are only charged when they are running. This means that we only pay for the resources that we use.
- **Scalable:** The API can be scaled automatically by increasing the number of AWS Lambda functions that are used to handle requests.
- **Easily Monitored:** The API can be monitored using the AWS CloudWatch console. The CloudWatch console provides metrics for the number of requests that are made to the API, the response time for each request, and the errors that occur.

To represent a message in dynamoDB we use an object that looks identical to the message resource

| Parameter | Type | Description | Example |
| :- | :-: | :- | :- |
| message | string| contents of the message | "hello"
| id | **DDB Primary Key:** string | uuid of the message | "d17fdd83-da28-4b1b-97bf-8e0c572c80b5" |

The rest api calls almost identically call dynamodb with these entries. The actual server functionality runs within
an AWS lambda, defined in the `lambda` subdirectory of this monorepo, which handles the core api calls.

## Front End

The frontend is designed very simply, with an index.html stored within the `/dist` folder along with a config.
Webpack packages the typescript into an entirely contained `bundle.js` file.

We read client API data from a locally stored `config.json` file within the dist folder.

## Pipelines

Our full continuous integration pipeline will consists of two workflows: a **pre-merge workflow** and a
**post-merge workflow**. The pre-merge workflow is responsible for testing and linting the code before
it is merged. The post-merge workflow is responsible for deploying the approved code to the corresponding
environments.

<img src="./documents/Workflow%20Diagrams.png" width="500" height="auto">

The deployment workflow will includes two AWS environments, both managed by the same account.
The development environment will be deployed to the region us-west-2, and the production environment
will be deployed to us-east-1.

# Getting Started

## Development Setup

To get started run `build-scripts install` and defer to the instructions in the sub directories if you
run into any issues. The most detailed description for putting together the repo will be found in each sub-folder directly,
but once those are all set up you can use the `build-scripts` command:

To simulate the pipeline, run the following command:

      > build-scripts install build lint test deploy clean

You can string together any commands you'd like and it'll run those commands in every subdirectory
for which it's relevant in the correct order.
