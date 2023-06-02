// Import the AWS CDK
import { Construct } from 'constructs';
import { resolve } from "path";
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as assets from 'aws-cdk-lib/aws-s3-assets';
import * as apig from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

/**
* @class CloudFormationStack
* @classdesc Creates a Cloudformation stack with a website, a DynamoDB table, and a Lambda function.
*/
export class CloudFormationStack extends cdk.Stack {

    /**
    * @constructor
    * @param {Construct} scope The AWS CDK construct scope.
    * @param {string} id The stack ID.
    * @param {cdk.StackProps} props The stack properties.
    */
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const websiteBucket: s3.Bucket = this.createOrUpdateWebsiteBucket();
        const messageTable: dynamodb.Table = this.createOrUpdateMessageTable();
        const serverLambda: lambda.Function = this.createOrUpdateServerLambda(messageTable);
        const messageApi: apig.LambdaRestApi = this.createOrUpdateMessageServerApi(serverLambda);
        const websiteUser: iam.User = this.createOrUpdateWebsiteUser(messageApi);
    }

    /**
    * @private
    * @method createOrUpdateWebsiteBucket
    * @description Creates a S3 bucket to host the website and sets up deployment to the bucket.
    * @returns {s3.Bucket} The S3 bucket.
    */
    createOrUpdateWebsiteBucket(): s3.Bucket {

        // Create S3 Bucket to host the core website.
        const websiteBucket: s3.Bucket = new s3.Bucket(this, 'WebsiteBucket', {
            websiteIndexDocument: "index.html", // TODO: Move constants to a configuration file.
            websiteErrorDocument: "404.html",
            publicReadAccess: true,
            // Note: block public access options supercedes other access policies.
            // Setting all of these to false does not allow the public to do anything
            // beyond what they are allowed by other explicit policies.
            blockPublicAccess: {
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false,
            }
        });

        // Create deployment.
        new s3deploy.BucketDeployment(this, 'WebsiteDeployment', {
            sources: [s3deploy.Source.asset(resolve(__dirname, "../../website/src"))],
            destinationBucket: websiteBucket,
        });

        // Return bucket resource.
        return websiteBucket;
    }

    /**
    * @private
    * @method createOrUpdateMessageTable
    * @description Creates a DynamoDB table to store messages.
    * @returns {dynamodb.Table} The DynamoDB table.
    */
    createOrUpdateMessageTable(): dynamodb.Table {
        // Create DynamoDB table to store the messages. Encrypted by default.
        return new dynamodb.Table(this, 'MessageTable', {
            partitionKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING,
            },
        });
    }

    /**
    * @private
    * @method createOrUpdateServerLambda
    * @description Creates a Lambda function to handle requests to the website.
    * @param {dynamodb.Table} messageTable The DynamoDB table to store messages.
    * @returns {lambda.Function} The Lambda function.
    */
    createOrUpdateServerLambda(messageTable: dynamodb.Table): lambda.Function {

        // Define lambda function code as assets to be deployed with the rest of
        // the infrastructure.
        const lambdaAsset: assets.Asset = new assets.Asset(this, "LambdaAssetsZip", {
            path: resolve(__dirname, "../../lambda/src"),
        })

        // Create a Server Lambda resource
        const serverLambda: lambda.Function = new lambda.Function(this, 'ServerLambda', {
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromBucket(
                lambdaAsset.bucket,
                lambdaAsset.s3ObjectKey,
            ),
            // Lambda should be very fast. Something is wrong if it takes > 5 seconds.
            timeout: cdk.Duration.seconds(5),
            handler: "entrypoint.handler", // TODO: Move constants to a configuration file.
            environment: {
                // Give lambda access to the table name.
                MESSAGE_TABLE_NAME: messageTable.tableName,
            }
        });

        // Give the server lambda full access to the DynamoDB table.
        messageTable.grantReadWriteData(serverLambda);

        // Return lambda resource.
        return serverLambda;
    }

    /**
    * @private
    * @method createOrUpdateMessageServerApi
    * @description Creates a REST API to expose the Lambda function.
    * @param {lambda.Function} serverLambda The Lambda function that handles the api requests.
    * @returns {apig.LambdaRestApi} The REST API.
    */
    createOrUpdateMessageServerApi(serverLambda: lambda.Function): apig.LambdaRestApi {

        // Instantiate rest api.
        const restApi = new apig.LambdaRestApi(this, "MessageServerAPI", {
            handler: serverLambda,
            proxy: false,
            // Allow all origins - we maintain security with the AWS Credentials and prevent
            // misuse with throttling.
            defaultCorsPreflightOptions: {
                allowOrigins: ["*"],
                allowCredentials: true,
            }
        });

        // Add api calls for base messages api.
        const messages = restApi.root.addResource('messages');
        messages.addMethod('GET');   // GET /messages
        messages.addMethod('POST');  // POST /messages

        // Add api call for geting a message by id.
        const message = messages.addResource('{message_id}');

        // Define `message_id` as a required parameter so autogenerated SDK includes it when generating path.
        const messageResourceMethodOptions = { requestParameters: { "method.request.path.message_id": true } }
        message.addMethod('GET', undefined, messageResourceMethodOptions); // GET /messages/{message_id}

        // Return api resource.
        return restApi;
    }

    /**
    * @private
    * @method createOrUpdateWebsiteUser
    * @description Creates an IAM user for the website to access the message api.
    * @param {apig.LambdaRestApi} messageApi The API the user should will access to.
    * @returns {iam.User} The IAM user.
    */
    createOrUpdateWebsiteUser(messageApi: apig.LambdaRestApi): iam.User {
        const websiteUser = new iam.User(this, "WebsiteUser");
        messageApi.methods.forEach((method) => method.grantExecute(websiteUser));
        return websiteUser;
    }
}
