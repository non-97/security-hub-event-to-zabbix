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

        # Get zabbix host and item key from event.
        zabbix_host = event['zabbixHost']
        zabbix_item_key = event['zabbixItemKey']

        if zabbix_host is None or zabbix_item_key is None:
            logger.error("Zabbix host and item key are not properly set")
            return

        zabbix_server_ip = os.getenv('ZABBIX_SERVER_IP_ADDRESS')
        zabbix_server_port = int(os.getenv('ZABBIX_SERVER_PORT'))

        zabbix_event_data = [ZabbixMetric(zabbix_host, zabbix_item_key, json.dumps(event['event']))]

        zabbix_sender = ZabbixSender(zabbix_server_ip, zabbix_server_port)
        zabbix_sender_response = zabbix_sender.send(zabbix_event_data)
        
        logger.info(zabbix_sender_response)

    except Exception as e:
        logger.error("Error occurred: {}".format(e))