import { CloudFormationStackProps } from "./cloud_formation-stack-props";

/**
 * This class provides utility methods for working with out AWS CloudFormation stack.
 */
export class CloudFormationStackUtils {

    /*
    * The name of the current stage. Defaults to 'dev'.
    */
    private static stageName?: string;

    /*
    * The AWS account ID. Defaults to the value of the `AWS_ACCOUNT` environment variable, or `CDK_DEFAULT_ACCOUNT` if that is not set.
    */
    private static awsAccount?: string;

    /*
    * The AWS region. Defaults to the value of the `AWS_REGION` environment variable, or `CDK_DEFAULT_REGION` if that is not set.
    */
    private static awsRegion?: string;

    /*
    * Returns the current stage name.
    */
    public static getStageName(): string {
        this.stageName ??= (process.env.AWS_STAGE ?? "dev");
        return this.stageName;
    }

    /*
    * Returns the AWS account ID.
    */
    public static getAwsAccount(): string | undefined {
        this.awsAccount ??= (process.env.AWS_ACCOUNT ?? process.env.CDK_DEFAULT_ACCOUNT);
        return this.awsAccount;
    }

    /*
    * Returns the AWS region.
    */
    public static getAwsRegion(): string | undefined {
        this.awsRegion ??= (process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION);
        return this.awsRegion;
    }

    /*
    * Returns a unique resource name for the given resource ID.
    */
    public static getResourceName(resourceId: string, props: CloudFormationStackProps): string {
        return [
            resourceId,
            props.env.account,
            props.env.region,
            props.stageName,
        ].join("-");
    }
}
