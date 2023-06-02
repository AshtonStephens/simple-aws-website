/*
This file defines the `CloudFormationStackProps` interface.

The `CloudFormationStackProps` interface extends the `cdk.StackProps` interface
and adds a single required property: `stageName`.
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
}