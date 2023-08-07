import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Vpc } from "./constructs/vpc";
import { Ec2Instance } from "./constructs/ec2-instance";
import { CloudWatchAlarm } from "./constructs/cloudwatch-alarm";
import { LambdaFunction } from "./constructs/lambda";

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
  }
}
