import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface EventBridgeRuleToZabbixProps {
  eventPattern: cdk.aws_events.EventPattern;
  lambda: cdk.aws_lambda.IFunction;
  zabbixHost: string;
  zabbixItemKey: string;
}

export class EventBridgeRuleToZabbix extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: EventBridgeRuleToZabbixProps
  ) {
    super(scope, id);

    new cdk.aws_events.Rule(this, "Default", {
      eventPattern: props.eventPattern,
      targets: [
        new cdk.aws_events_targets.LambdaFunction(props.lambda, {
          event: cdk.aws_events.RuleTargetInput.fromObject({
            event: cdk.aws_events.EventField.fromPath("$"),
            zabbixHost: props.zabbixHost,
            zabbixItemKey: props.zabbixItemKey,
          }),
        }),
      ],
    });
  }
}
