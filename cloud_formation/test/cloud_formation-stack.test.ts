import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { CloudFormationStack } from '../lib/cloud_formation-stack';
import { CloudFormationStackProps } from '../lib/cloud_formation-stack-props';

// Constant test values
const TEST_STACK_PROPS: CloudFormationStackProps = {
    stageName: "dummyStage",
    env: {
        account: "account",
        region: "region",
    },
}

describe('CloudFormationStack Test', () => {
    it('should create a S3 bucket', async () => {
        // Arrange
        const app = new cdk.App();
        const stack = new CloudFormationStack(app, 'TestStack', TEST_STACK_PROPS);

        // Act
        const template = Template.fromStack(stack);

        // Assert
        template.hasResourceProperties('AWS::S3::Bucket', {
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: false,
                BlockPublicPolicy: false,
                IgnorePublicAcls: false,
                RestrictPublicBuckets: false,
            },
            WebsiteConfiguration: {
                ErrorDocument: "404.html",
                IndexDocument: "index.html"
            }
        });
    });

    it('should create a DynamoDB table', async () => {
        // Arrange
        const app = new cdk.App();
        const stack = new CloudFormationStack(app, 'TestStack', TEST_STACK_PROPS);

        // Act
        const template = Template.fromStack(stack);

        // Assert
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            // TODO: Add check for properties linking resources created during cdk build.
            KeySchema: [
                {
                    AttributeName: "id",
                    KeyType: "HASH"
                },
            ]
        });
    });

    it('should create a Lambda function', async () => {
        // Arrange
        const app = new cdk.App();
        const stack = new CloudFormationStack(app, 'TestStack', TEST_STACK_PROPS);

        // Act
        const template = Template.fromStack(stack);

        // Assert
        template.hasResourceProperties('AWS::Lambda::Function', {
            // TODO: Add check for properties linking resources created during cdk build.
            Handler: "entrypoint.handler",
            Runtime: "python3.9",
            Timeout: 5,
        });
    });

    it('should create a REST API', async () => {
        // Arrange
        const app = new cdk.App();
        const stack = new CloudFormationStack(app, 'TestStack', TEST_STACK_PROPS);

        // Act
        const template = Template.fromStack(stack);

        // Assert
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
            // TODO: Add check for properties linking resources created during cdk build.
        });
        // TODO: add REST API endpoints.
    });

    it('should create an IAM User', async () => {
        // Arrange
        const app = new cdk.App();
        const stack = new CloudFormationStack(app, 'TestStack', TEST_STACK_PROPS);

        // Act
        const template = Template.fromStack(stack);

        // Assert
        template.hasResourceProperties('AWS::IAM::User', {
            // TODO: Add check for properties linking resources created during cdk build.
        });
    });
});
