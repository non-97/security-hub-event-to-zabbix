import * as cdk from "aws-cdk-lib";
import * as lambda_python from "@aws-cdk/aws-lambda-python-alpha";
import { EventBridgeRuleToZabbix } from "./event-bridge-rule-to-zabbix";
import { Construct } from "constructs";
import * as path from "path";

export interface LambdaEventToZabbixProps {
  vpc: cdk.aws_ec2.IVpc;
  securityGroup: cdk.aws_ec2.ISecurityGroup;
  zabbixServerIpAddress: string;
}

export class LambdaEventToZabbix extends Construct {
  constructor(scope: Construct, id: string, props: LambdaEventToZabbixProps) {
    super(scope, id);

    const lambda = new lambda_python.PythonFunction(this, "Default", {
      functionName: "send-event-to-zabbix",
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
      entry: path.join(__dirname, "../lambda/send-event-to-zabbix/"),
      handler: "lambda_handler",
      vpc: props?.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetGroupName: "Public",
      }),
      securityGroups: [props?.securityGroup],
      allowPublicSubnet: true,
      timeout: cdk.Duration.seconds(10),
      logRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      environment: {
        ZABBIX_SERVER_IP_ADDRESS: props.zabbixServerIpAddress,
        ZABBIX_SERVER_PORT: "10051",
      },
    });

    // EventBridge Rule for Security Hub
    new EventBridgeRuleToZabbix(this, "SecurityHubRule", {
      eventPattern: {
        source: ["aws.securityhub"],
        detailType: ["Security Hub Findings - Imported"],
        detail: {
          findings: {
            ProductFields: {
              StandardsArn: [
                "arn:aws:securityhub:::standards/aws-foundational-security-best-practices/v/1.0.0",
              ],
            },
            Compliance: {
              Status: [
                {
                  "anything-but": "PASSED",
                },
              ],
            },
            Severity: {
              Label: ["CRITICAL", "HIGH"],
            },
            Workflow: {
              Status: ["NEW"],
            },
            RecordState: ["ACTIVE"],
          },
        },
      },
      lambda,
      zabbixHost: "AWS Events",
      zabbixItemKey: "aws.event.securityhub",
    });

    // EventBridge Rule for GuardDuty
    new EventBridgeRuleToZabbix(this, "GuardDutyRule", {
      eventPattern: {
        source: ["aws.securityhub"],
        detailType: ["Security Hub Findings - Imported"],
        detail: {
          findings: {
            ProductArn: [{ suffix: "::product/aws/guardduty" }],
            Severity: {
              Label: ["MEDIUM", "HIGH", "CRITICAL"],
            },
          },
        },
      },
      lambda,
      zabbixHost: "AWS Events",
      zabbixItemKey: "aws.event.guardduty",
    });
  }
}
