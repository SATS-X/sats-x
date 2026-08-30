import json
import boto3
import base64
import datetime
from datetime import timedelta, timezone

s3_client = boto3.client('s3')
apigw_management_api = None

BUCKET_NAME = "attendance-system-nckh"

def lambda_handler(event, context):
    global apigw_management_api

    print(f"Event received: {event}")

    connection_id = event['requestContext']['connectionId']
    route_key = event['requestContext']['routeKey']

    # Khởi tạo API Gateway Management API để gửi message lại cho client
    if apigw_management_api is None:
        domain_name = event['requestContext']['domainName']
        stage = event['requestContext']['stage']
        endpoint_url = f"https://{domain_name}/{stage}"
        apigw_management_api = boto3.client(
            'apigatewaymanagementapi',
            endpoint_url=endpoint_url,
            region_name='ap-southeast-1'
        )

    if route_key == '$connect':
        print(f"Client connected: {connection_id}")
        return {'statusCode': 200, 'body': 'Connection successful.'}

    if route_key == '$disconnect':
        print(f"Client disconnected: {connection_id}")
        return {'statusCode': 200, 'body': 'Disconnection successful.'}

    # Mặc định message trả về
    response_message_body = {}

    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        body = {}

    if route_key == 'upload':
        try:
            deviceId = body.get("deviceId")
            image_base64 = body.get("image")

            if not deviceId or not image_base64:
                response_message_body = {
                    "status": "error",
                    "message": "deviceId and image are required."
                }
            else:
                # Lấy thời gian hiện tại theo múi giờ VN
                now_utc = datetime.datetime.now(timezone.utc)
                vietnam_offset = timedelta(hours=7)
                now_vietnam = now_utc + vietnam_offset
                date_string = now_vietnam.strftime("%d-%m-%Y")
                timestamp = now_vietnam.strftime("%Y-%m-%d_%H-%M-%S")

                # Giải mã ảnh từ base64
                image_data = base64.b64decode(image_base64)

                # Đường dẫn file trên S3
                file_path = f"history/{deviceId}/{date_string}/{timestamp}.jpg"

                # Upload lên S3
                s3_client.put_object(
                    Bucket=BUCKET_NAME,
                    Key=file_path,
                    Body=image_data,
                    ContentType="image/jpeg"
                )

                file_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_path}"

                response_message_body = {
                    "status": "success",
                    "action": "upload",
                    "message": "File uploaded successfully.",
                    "file_url": file_url,
                    "metadata": {
                        "deviceId": deviceId,
                        "date": date_string,
                        "timestamp": timestamp,
                        "timezone": "Vietnam (GMT+7)"
                    }
                }

        except Exception as e:
            response_message_body = {
                "status": "error",
                "message": "Error uploading file",
                "error": str(e)
            }

    else:
        response_message_body = {
            "status": "error",
            "message": "Action not supported."
        }

    try:
        apigw_management_api.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(response_message_body).encode('utf-8')
        )
    except apigw_management_api.exceptions.GoneException:
        print(f"Unable to send message. Client disconnected: {connection_id}")
    except Exception as e:
        print(f"Error sending response message: {e}")
        return {'statusCode': 500, 'body': f'Server error: {e}'}

    return {'statusCode': 200, 'body': 'Data processed and sent successfully.'}