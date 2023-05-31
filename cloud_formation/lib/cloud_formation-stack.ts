// Import the AWS CDK
import { Construct } from 'constructs';
import { resolve } from "path";
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as assets from 'aws-cdk-lib/aws-s3-assets';
import * as apig from 'aws-cdk-lib/aws-apigateway';

export class CloudFormationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket to host the core website. Encrypted by default.
    const siteBucket = new s3.Bucket(this, 'RelayWebapp');

    // Create DynamoDB table to store the messages. Encrypted by default.
    const messageTable = new dynamodb.Table(this, 'MessageTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Define lambda function code as assets to be deployed with the rest of
    // the infrastructure.
    const lambdaAsset: assets.Asset = new assets.Asset(this, "LambdaAssetsZip", {
      path: resolve(__dirname, "../../lambda/src"),
    })

    // Create a Server Lambda resource
    const serverLambda = new lambda.Function(this, 'RelayServerLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromBucket(
        lambdaAsset.bucket,
        lambdaAsset.s3ObjectKey,
      ),
      // Lambda should be very fast. Something is wrong if it takes > 5 seconds.
      timeout: cdk.Duration.seconds(5),
      handler: "entrypoint.handler",
      environment: {
        // Give lambda access to the table arn
        MESSAGE_TABLE_NAME: messageTable.tableName,
      }
    });

    // Give the server lambda full access to the DynamoDB table.
    messageTable.grantReadWriteData(serverLambda);

    // Define REST API
    const restApi = new apig.LambdaRestApi(this, "RelayServerAPI", {
      handler: serverLambda,
      proxy: false,
    });

    const messages = restApi.root.addResource('messages');
    messages.addMethod('GET');   // GET /messages
    messages.addMethod('POST');  // POST /messages

    const message = messages.addResource('{message_id}');
    message.addMethod('GET');   // GET /messages/{message_id}
  }
}
