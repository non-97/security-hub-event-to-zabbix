import boto3
import os
import json
import logging
from pyzabbix import ZabbixMetric, ZabbixSender

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        logger.info(event)

        # Get alarm ARN from event
        alarm_arn = event['resources'][0]

        # Create a Resource Groups Tagging API client
        resource_tagging_client = boto3.client('resourcegroupstaggingapi')

        # Get the resource tags
        response = resource_tagging_client.get_resources(ResourceARNList=[alarm_arn])

        zabbix_host = None
        zabbix_item_key = None
        
        # Assuming ResourceTagMappingList always contains exactly one item
        resource_tags = response['ResourceTagMappingList'][0]['Tags']

        for tag in resource_tags:
            if tag['Key'] == 'Zabbix Host':
                zabbix_host = tag['Value']
            elif tag['Key'] == 'Zabbix Item Key':
                zabbix_item_key = tag['Value']

        if zabbix_host is None or zabbix_item_key is None:
            logger.error("Zabbix tags are not properly set")
            return

        zabbix_server_ip = os.getenv('ZABBIX_SERVER_IP_ADDRESS')
        zabbix_server_port = int(os.getenv('ZABBIX_SERVER_PORT'))

        zabbix_event_data = [ZabbixMetric(zabbix_host, zabbix_item_key, json.dumps(event))]

        zabbix_sender = ZabbixSender(zabbix_server_ip, zabbix_server_port)
        zabbix_sender_response = zabbix_sender.send(zabbix_event_data)
        
        logger.info(zabbix_sender_response)

    except Exception as e:
        logger.error("Error occurred: {}".format(e))