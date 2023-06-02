#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CloudFormationStack } from '../lib/cloud_formation-stack';
import { CloudFormationStackUtils } from '../lib/cloud_formation-stack-util';

const app = new cdk.App();
new CloudFormationStack(app, 'CloudFormationStack', {
    stageName: CloudFormationStackUtils.getStageName(), // Default to dev stage.
    env: {
        account: CloudFormationStackUtils.getAwsAccount(),
        region: CloudFormationStackUtils.getAwsRegion()
    },
});