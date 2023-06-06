/*
This file defines the `CloudFormationStackProps` interface.

The `CloudFormationStackProps` interface extends the `cdk.StackProps` interface.
*/

import * as cdk from 'aws-cdk-lib';

export interface CloudFormationStackProps extends cdk.StackProps {

  /**
   * The stageName of the AWS CloudFormation stack.
   */
  readonly stageName: string;

  /**
   * Env is required.
   */
  readonly env: cdk.Environment;

  // TODO: Require access keys for api using sigv4 auth.
  //
  // /**
  //  * The website user access key.
  //  */
  // readonly websiteUserAccessKey?: string;
  //
  // /**
  //  * The website user secret key.
  //  */
  // readonly websiteUserSecretKey?: string;
}