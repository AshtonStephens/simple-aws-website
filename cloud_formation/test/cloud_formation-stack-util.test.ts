import { CloudFormationStackProps } from '../lib/cloud_formation-stack-props';
import { CloudFormationStackUtils } from '../lib/cloud_formation-stack-util';

describe('CloudFormationStackUtil Test', () => {

    beforeEach(() => {
        jest.resetModules();
    })

    it('test resource name is generated properly.', async () => {
        const testCloudFormationStackProps: CloudFormationStackProps = {
            stackName: "testStack",
            stageName: "testStage", // Default to dev stage.
            env: {
                account: "testAwsAccount",
                region: "testAwsRegion",
            },
        }
        const resourceName: string = CloudFormationStackUtils
            .getResourceName("ResourceId", testCloudFormationStackProps);
        expect(resourceName).toEqual("ResourceId-testAwsAccount-testAwsRegion-testStage");
    });

    it('Test resource name is generated properly.', async () => {
        process.env = {
            AWS_STAGE: "TestStage",
            AWS_ACCOUNT: "TestAccount" ,
            AWS_REGION: "TestRegion",
        };
        const resourceName: string = CloudFormationStackUtils.getStackName("StackId");
        expect(resourceName).toEqual("StackId-TestAccount-TestRegion-TestStage");
    });

    // it('test apiDefinitionWithLambdaIntegration', async () => {
    //     // TODO:
    // });

});
