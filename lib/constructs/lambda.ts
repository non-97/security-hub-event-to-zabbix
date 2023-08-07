import * as cdk from "aws-cdk-lib";
import * as lambda_python from "@aws-cdk/aws-lambda-python-alpha";
import { Construct } from "constructs";
import * as path from "path";

export interface LambdaFunctionProps {
  vpc: cdk.aws_ec2.IVpc;
  securityGroup: cdk.aws_ec2.ISecurityGroup;
  zabbixServerIpAddress: string;
}

export class LambdaFunction extends Construct {
  readonly zabbixSenderSg: cdk.aws_ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    const role = new cdk.aws_iam.Role(this, "Role", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaVPCAccessExecutionRole"
        ),
        new cdk.aws_iam.ManagedPolicy(this, "TagGetResources", {
          statements: [
            new cdk.aws_iam.PolicyStatement({
              effect: cdk.aws_iam.Effect.ALLOW,
              resources: ["*"],
              actions: ["tag:GetResources"],
            }),
          ],
        }),
      ],
    });

    const lambda = new lambda_python.PythonFunction(this, "Default", {
      functionName: "send-alarm-event-to-zabbix",
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
      entry: path.join(__dirname, "../lambda/send-alarm-event-to-zabbix/"),
      handler: "lambda_handler",
      vpc: props?.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetGroupName: "Public",
      }),
      securityGroups: [props?.securityGroup],
      allowPublicSubnet: true,
      role,
      timeout: cdk.Duration.seconds(10),
      logRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      environment: {
        ZABBIX_SERVER_IP_ADDRESS: props.zabbixServerIpAddress,
        ZABBIX_SERVER_PORT: "10051",
      },
    });

    new cdk.aws_events.Rule(this, "Rule", {
      eventPattern: {
        source: ["aws.cloudwatch"],
        detailType: ["CloudWatch Alarm State Change"],
        detail: {
          alarmName: [{ suffix: "to-zabbix" }],
        },
      },
      targets: [new cdk.aws_events_targets.LambdaFunction(lambda)],
    });
  }
}
