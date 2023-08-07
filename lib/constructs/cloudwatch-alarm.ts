import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface CloudWatchAlarmProps {}

export class CloudWatchAlarm extends Construct {
  constructor(scope: Construct, id: string, props?: CloudWatchAlarmProps) {
    super(scope, id);

    const alarm = new cdk.aws_cloudwatch.Alarm(this, "Default", {
      alarmName: "alarm-test-to-zabbix",
      alarmDescription: "test description",
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 1,
      evaluationPeriods: 1,
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: "AWS/States",
        metricName: "ProvisionedRefillRate",
        dimensionsMap: { ServiceMetric: "StateTransition" },
        period: cdk.Duration.seconds(60),
      }),
    });

    cdk.Tags.of(alarm).add("Zabbix Host", "Zabbix server");
    cdk.Tags.of(alarm).add("Zabbix Item Key", "cloudwatch.alarm.test-item");
  }
}
