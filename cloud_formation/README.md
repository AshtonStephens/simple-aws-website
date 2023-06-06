# Message Demo Cloud Formation Resources

## Cheat sheet

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

---

## Introduction

This repository contains a CDK TypeScript Stack that can be used to deploy a variety of AWS resources. The stack is designed to be easy to use and extend, and can be used for both development and production environments.

### Background

TypeScript CDK is a cloud development kit (CDK) for TypeScript that allows us to define cloud infrastructure using
TypeScript code. The AWS CDK is a set of libraries that allows us to define AWS infrastructure using code, which
is generally more flexible and robust than the traditional method of defining a cloud formation stack manually in
a yaml file.

This cloud formation template is responsible deploying the entire `MessageDemo` stack and deploying the code assets
along with it. These resources include, but are not limited to:
- A DynamoDB table for messages
- A Lambda function that handles API calls
- A Lambda backed API Gateway with the interface defined in the `api_definition` folder
- An IAM user with access to the API
- A bucket that will host the final website.

The website that is created can be accessed at: `http://{YOUR_BUCKET_NAME}.s3-website.{REGION}.amazonaws.com/` once
deployed.

---

## Getting Started

### Some helpful links

- [AWS Console](console.aws.amazon.com)
- [CDK deployment troubleshooting](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/troubleshooting.html)

### Prerequisites

To get started with this stack, you will need to have the following items setup:

1. Software dependencies installed
    1. The current long term support version of node (18.12.0)
    1. aws-cdk globally installed with `npm install -g aws-cdk@2.81.0`
1. An AWS account for development. You won't get charged unless you do something really big. ([instructions](https://aws.amazon.com/resources/create-account/))
1. An AWS credentials set up locally.
    1. In AWS console search for "IAM" on the top search bar.
    1. Create a user with admin permissions
        1. Click the "User" options on the left panel
        1. Click the "Add users" button
        1. Give your user a name, like Admin or something similar - no need to give it console access.
        1. Select the "Attach policies directly" option and then under "Permissions policies" search for and select "AdministratorAccess"
        1. Hit "Next", and then "Create user"
    1. Get the credentials for the admin user
        1. Click the "User" options on the left panel
        1. Click on the user you just created
        1. Under the "Security credentials" tab click "Create access key" button under "Access keys"
        1. Select "other" and then hit "Next"
        1. Give your credentials a description. "Dev admin credentials" is fine.
        1. Copy both the access key AND secret access key to somewhere locally.
    1. Assign your credentials to your aws config
        1. open the file stored in `~/.aws/credentials` if you're on a mac. (I don't have time for the windows instructions sorry)
        1. Paste the credentials into the file like this, with the region as `us-west-2`:

                [default]
                aws_access_key_id = {YOUR_ACCESS_KEY}
                aws_secret_access_key = {YOUR_SECRET_ACCESS_KEY}
                region = us-west-2

### Initial Deployment

To locally build the application you'll need to run the following commands with the project subdirectory that contains
this readme file.

    npm install
    cdk bootstrap # Set up asset deployment bucket. This need only be run once.

Then for every deployment onward you can run just the build and deploy command

    npm run build
    cdk deploy # Deploy using your locally defined AWS account credentials.

Once the stack is deployed, you will be able to access the deployed resources using the AWS Console or the AWS CLI.
**All local resources, including the python source code and website contents, will be deployed.** The website deployed
will use the last version that you built, so if you want to update the website code you need to run the build command
with your latest changes.

---

## Working with your Stack

Every single AWS resource can be accessed by AWS Console. Your CDK deployment deployed many resources, all of which are
managed by the stack that you created. To observe all of the resources within your stack go to the CloudFormation page
in AWS Console by searching for `CloudFormation` in the top bar.

To work with the individual resources, I recommend you read Amazon's documentation on how to debug issues on each resource
as each one is different.

---

## Troubleshooting

**AWS documentation is hit and miss, but
[this guideline](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/troubleshooting.html)
is pretty good for debugging CloudFormation deployment errors.**

If anything goes wrong with your stack you'll be able to see the error logs in the terminal when you run `cdk deploy`.
If you want to see more details you can log into the AWS console and go to `CloudFormation` in the search bar up top
and then click on the stack that you want to analyze.

### Common Errors - Deployment Permission

Likely log search string for error: `is not authorized to perform`

Example error:

    handler returned message: "User: arn:aws:iam::742119907435:user/{ USER } is not authorized to perform: { ACTION } on resource: { RESOURCE } because no identity-based policy allows the { ACTION } action (Service: Ecr, Status Code: 400, Request ID: ####)" (RequestToken: ####, HandlerErrorCode: GeneralServiceException)

To resolve this, find the the IAM user that you're using locally to deploy and verify that that user has admin
permissions.

### Common Errors - Resource Already Exists

Likely log search string for error: `already exists`

Example error:

    Deployment failed: Error: The stack named { STACK } failed to deploy: UPDATE_ROLLBACK_COMPLETE: { RESOURCE } already exists

This error usually occurs because you've either changed the overall stack name or changed a resource name and then
changed the name back. To fix this you can almost always manually delete the conflicting resources and re-run.

This error occurs because some AWS resources cannot be renamed, and where some resources are deleted and re-created when they are renamed in a cloud formation template (like apigateway) others are simply re-created without the original being
deleted. These resources are almost always tied to some form of persistent storage like a DynamoDB table or an S3 bucket.
