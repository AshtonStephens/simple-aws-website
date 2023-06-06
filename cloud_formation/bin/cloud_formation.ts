#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CloudFormationStack } from '../lib/cloud_formation-stack';
import { CloudFormationStackUtils } from '../lib/cloud_formation-stack-util';

const app = new cdk.App();
new CloudFormationStack(app, 'CloudFormationStack', {
    stackName: CloudFormationStackUtils.getStackName("MessageDemoWebsite"),
    stageName: CloudFormationStackUtils.getStageName(), // Default to dev stage.
    env: {
        account: CloudFormationStackUtils.getAwsAccount(),
        region: CloudFormationStackUtils.getAwsRegion()
    },

    // TODO: Require access keys for api using sigv4 auth.
    // websiteUserAccessKey: CloudFormationStackUtils.getWebsiteUserAccessKey(),
    // websiteUserSecretKey: CloudFormationStackUtils.getWebsiteUserSecretKey(),
});