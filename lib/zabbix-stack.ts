import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Vpc } from "./constructs/vpc";
import { Ec2Instance } from "./constructs/ec2-instance";
import { CloudWatchAlarm } from "./constructs/cloudwatch-alarm";
import { LambdaFunction } from "./constructs/lambda-cloudwatch-event-to-zabbix";
import { LambdaEventToZabbix } from "./constructs/lambda-event-to-zabbix";

export class ZabbixStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new Vpc(this, "Vpc");

    // Zabbix Server
    const zabbixServer = new Ec2Instance(this, "ZabbixServer", {
      vpc: vpc.vpc,
      securityGroup: vpc.zabbixServerSg,
    });

    // CloudWatch Alarm
    new CloudWatchAlarm(this, "CloudWatchAlarm");

    // Lambda Function
    new LambdaFunction(this, "LambdaFunction", {
      vpc: vpc.vpc,
      securityGroup: vpc.zabbixSenderSg,
      zabbixServerIpAddress: zabbixServer.instance.instancePrivateIp,
    });

    // Lambda Function for event to Zabbix
    new LambdaEventToZabbix(this, "LambdaEventToZabbix", {
      vpc: vpc.vpc,
      securityGroup: vpc.zabbixSenderSg,
      zabbixServerIpAddress: zabbixServer.instance.instancePrivateIp,
    });
  }
}
