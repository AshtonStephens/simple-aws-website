# Message Demo - Ashton Stephens Tech Project Interview for Trust Machines

This repository contains all the source code and cloud deployment configurations required to
fully deploy a server that can send and receive messages, and a website that interacts with it.
This project is part of an interview series with [Trust Machines](https://trustmachines.co/).

Original design documents **(not accurate anymore)** can be found here:
- [back end design document](./documents/Backend%20Server%20Design%20Document.pdf)
- [front end design document](./documents/Frontend%20Server%20Design%20Document.pdf)
- [continuous integration design document](./documents/Continuous%20Integration%20Design%20Document.pdf)


## Project Structure

The project is structured as a monorepo, with all the code and configuration files stored in the same directory. This makes it easy to manage and develop the project, as all the dependencies are already in place.

The project is divided into the following subdirectories:

- **cloud_formation:** Contains the AWS Cloud Formation templates used to deploy the server.
- **api_definition:** Contains the OpenAPI definition for the server's API.
- **lambda:** Contains the Python code for the Lambda function that handles the server's API requests.
- **website:** Contains the TypeScript and html code for the server's website.


## Accessing AWS Console for the Deployments.

I've created an AWS user for you all to use that includes only readonly permissions for some of the resources.

- **Account:** `742119907435`
- **Username:** `TrustMachinesInterviewer`
- **Password:** `iLoveDevOps!`

---

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

<img src="./documents/Message%20Website%20Diagram.png" width="500" height="auto">

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

### Backend Challenges

1. **AWS does not adequaltely support openAPI definitions linking to AWS lambda, so we needed to include some
odd string replacement code within the cloudformation template.** Amazon internally uses [smithy](https://smithy.io/2.0/index.html)
with an internal autogenerator. The OpenAPI generator struggles with some of the AWS specific content, which is
why AWS Auth became out of scope on this project. Additionally, AWS does not appear to fully conform to reading this specification within
cdk v2
[api-gateway-swagger-extensions-integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html). *I can give more details in person.*
1. **AWS does not support autogenerating code programatically from CDK:** This was a challenge I
discuss more in the next section; but overall you **must** use an api description format in order
to autogenerate your client locally, so the alternative of specifying the API within CDK proved
not to be an option. You can see what happend if you read the original backend deliverables document.

---

## Front End

### Front end design:
The frontend is designed very simply, with an index.html stored within the `/dist` folder along with a config.
Webpack packages the typescript into an entirely contained `bundle.js` file.

We read client API data from a locally stored `config.json` file within the dist folder.

### Frontend Challenges

1. I first started using plain javascript for the website code. Unfortunately, there is no good
way to get autogenerated javascript code from AWS programatically, and there is also no way to replace
the autogenerated javascript host url without editing the autogenerated source directly. This meant that using
the autogenerated javascript would be impossible without redownloading the SDK manually for each
environment.
1. **CORS** header errors were hard to interpret.
1. I didn't start using Webpack to build website javascript from typescript until about six/eight hours
into developing the website, where most of that time was dealing with errors that would be avoided with
webpack. Most web resources don't consider that you'd run the javascript you build from typescript in
a browser; they assume you're building for a node server.
1. API Security. The worst aspect of this project is that the API has no security on it. Fortunately,
I've included a solution for getting the credentials onto the website, but api doesn't need credentials
so I've commented out those sections. **There is a catch 22 on using CDK for this that I can explain in
remote person**, but it boils down to CDK not supporting something that it actually should. I'm sure if
I continued looking into this there'd be a solution.


### Deviations from the Original Plan - [original plan](./documents/Frontend%20Server%20Design%20Document.pdf)

- Originally, I planned to use a javascript SDK provided by AWS to interface with the apigateway, and I
planned to use the user access key and secret key to access the api. Instead, I ended up making the
api with OpenAPI3 and autogenerating the api.

---

## Pipelines

Our full continuous integration pipeline will consists of two workflows: a **pre-merge workflow** and a
**post-merge workflow**. The pre-merge workflow is responsible for testing and linting the code before
it is merged. The post-merge workflow is responsible for deploying the approved code to the corresponding
environments.

<img src="./documents/Workflow%20Diagrams.png" width="500" height="auto">

The deployment workflow will includes two AWS environments, both managed by the same account.
The development environment will be deployed to the region us-west-2, and the production environment
will be deployed to us-east-1.

### Alternative Considerations

- **Github Workflows over Code Pipeline:** While all the server assets are defined and deployed within the AWS ecosystem, the repository is currently managed in github. Using a code pipeline would break up the development workflow unnecessarily.
- **Using the same AWS account for each stage:** Normally it is better to have a separate AWS account for each stage because it’s easier to manage permissions for prod and beta accounts separately. In this case we’re making a demo so there’s no need to have two accounts. If we choose to, we can swap the AWS credentials in git to deploy to a different account and change client api endpoints and there shouldn’t be any problems.
- **us-west-2 and us-east-1 as deployment regions:** Amazon internally has regular practices around beta and production environments, and therefore AWS has some hidden preference for deployment regions. Amazon internally uses us-west-2 for nearly all dev/beta accounts and us-east-1 for north american production environments.

### Deviations from the Plan - [Original Plan](./documents/Continuous%20Integration%20Design%20Document.pdf)

1. **Not using Nix:** In the original plan we were going to use NixOS to download dependencies
reliably. I ended up reading a few angry programmers talking about how their devops team had
decided to use nix for the same reason I did while I was getting it set up - and they hated id.
So I changed course.

# Getting Started

## Development Setup

To get started run `build-scripts install` and defer to the instructions in the sub directories if you
run into any issues. The most detailed description for putting together the repo will be found in each sub-folder directly,
but once those are all set up you can use the `build-scripts` command:

To simulate the pipeline, run the following command:

      > build-scripts install build lint test deploy clean

You can string together any commands you'd like and it'll run those commands in every subdirectory
for which it's relevant in the correct order.

---

# Appendix
## Task

In a single mono repo:

1. Develop a simple HTTP relay server using a programming language of your choice. The server should have three functionalities:
   - Receive a message, assign a unique number to it, and return the number.
   - Accept a unique number and return the corresponding message.
   - Display the total number of messages stored on the server.

2. Create a user-friendly web app for the server, enabling users to:
   - View the total number of messages on the server.
   - Submit a new message and receive a unique number for it.
   - Enter a unique message number to retrieve the corresponding message.

3. Implement Continuous Integration (CI) and Continuous Deployment (CD) for the project. Ensure that the CI tests the applications.

4. Thoroughly document the deployment process, detailing how developers can deploy, debug, and test the project using local or isolated environments.

Assume that this repo will serve as a starting point for a team of developers and independent contributors. Focus on providing the basic functionalities without incorporating additional features. However, consider various aspects of the project's future development and best practices. Make provisions for the project's potential evolution and scalability, as its direction remains uncertain. Include these considerations in the documentation.
