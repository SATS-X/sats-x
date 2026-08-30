import json
import boto3
import base64
import datetime
from datetime import timedelta, timezone

# Khởi tạo clients
rekognition_client = boto3.client(
    'rekognition',
    region_name='ap-southeast-1'
)

s3_client = boto3.client('s3', region_name='ap-southeast-1')
apigw_management_api = None

BUCKET_NAME = "attendance-system-nckh"

def lambda_handler(event, context):
    global apigw_management_api

    print(f"Event received: {event}")

    connection_id = event['requestContext']['connectionId']
    route_key = event['requestContext']['routeKey']

    # Khởi tạo API Gateway Management API để gửi message về cho client
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

    response_message_body = {}

    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        body = {}

    if route_key == 'compare':
        try:
            image_base64 = body.get("image")
            device_id = body.get("deviceId", "unknown")
            collection_id = body.get("collection_id", "attendance-system-collection")  # Default collection

            print("Received deviceId:", device_id)
            print("Using collection_id:", collection_id)

            if not image_base64:
                response_message_body = {
                    'status': 'error',
                    'message': 'Missing image in request body',
                    'error': 'Missing image in request body'
                }
            else:
                # Lấy thời gian hiện tại theo múi giờ VN
                now_utc = datetime.datetime.now(timezone.utc)
                vietnam_offset = timedelta(hours=7)
                now_vietnam = now_utc + vietnam_offset
                timestamp = now_vietnam.isoformat()
                date_string = now_vietnam.strftime("%d-%m-%Y")
                timestamp_file = now_vietnam.strftime("%Y-%m-%d_%H-%M-%S")

                # Giải mã ảnh base64
                file_content = base64.b64decode(image_base64)

                # BƯỚC 1: Upload ảnh lên S3 trước
                upload_success = False
                file_url = ""
                upload_error = ""

                try:
                    # Đường dẫn file trên S3
                    file_path = f"history/{device_id}/{date_string}/{timestamp_file}.jpg"

                    # Upload lên S3
                    s3_client.put_object(
                        Bucket=BUCKET_NAME,
                        Key=file_path,
                        Body=file_content,
                        ContentType="image/jpeg"
                    )

                    file_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_path}"
                    upload_success = True
                    print(f"Image uploaded successfully to: {file_url}")

                except Exception as upload_err:
                    upload_error = str(upload_err)
                    print(f"Error uploading to S3: {upload_error}")

                # BƯỚC 2: Thực hiện compare face với AWS Rekognition
                face_compare_result = {}
                face_compare_success = False

                try:
                    response = rekognition_client.search_faces_by_image(
                        CollectionId=collection_id,
                        Image={'Bytes': file_content},
                        MaxFaces=1,
                        FaceMatchThreshold=95
                    )

                    print(f"Rekognition Response: {response}")

                    if response['FaceMatches']:
                        face_match = response['FaceMatches'][0]
                        similarity = face_match['Similarity']
                        external_id = face_match['Face'].get('ExternalImageId', 'N/A')
                        face_id = face_match['Face'].get('FaceId', 'N/A')

                        # Trích xuất tên từ external_id (VD: "TranDaiVi-001" thành "TranDaiVi")
                        name_user = external_id.rsplit('-', 1)[0] if external_id != 'N/A' else 'Unknown'

                        print(f"Matched Name: {name_user}")
                        print(f"Similarity: {similarity}%")

                        face_compare_result = {
                            'match_found': True,
                            'similarity': similarity,
                            'user_name': name_user,
                            'faceId': face_id,
                            'external_id': external_id,
                            'threshold_met': similarity >= 95
                        }
                        face_compare_success = True

                    else:
                        print("No matching face found.")
                        face_compare_result = {
                            'match_found': False,
                            'similarity': 0,
                            'user_name': 'None',
                            'faceId': None,
                            'external_id': None,
                            'threshold_met': False
                        }
                        face_compare_success = True

                except Exception as compare_err:
                    face_compare_result = {
                        'match_found': False,
                        'error': str(compare_err)
                    }
                    print(f"Error in face comparison: {compare_err}")

                # BƯỚC 3: Tổng hợp kết quả trả về
                if upload_success and face_compare_success:
                    response_message_body = {
                        'status': 'success',
                        'message': 'Image uploaded and face comparison completed successfully',
                        'upload_result': {
                            'success': True,
                            'file_url': file_url,
                            'file_path': file_path
                        },
                        'face_compare_result': face_compare_result,
                        'metadata': {
                            'device_id': device_id,
                            'collection_id': collection_id,
                            'date': date_string,
                            'timestamp': timestamp,
                            'timezone': 'Vietnam (GMT+7)'
                        }
                    }
                elif upload_success and not face_compare_success:
                    response_message_body = {
                        'status': 'partial_success',
                        'message': 'Image uploaded successfully but face comparison failed',
                        'upload_result': {
                            'success': True,
                            'file_url': file_url,
                            'file_path': file_path
                        },
                        'face_compare_result': face_compare_result,
                        'metadata': {
                            'device_id': device_id,
                            'collection_id': collection_id,
                            'date': date_string,
                            'timestamp': timestamp,
                            'timezone': 'Vietnam (GMT+7)'
                        }
                    }
                else:
                    response_message_body = {
                        'status': 'error',
                        'message': 'Both upload and face comparison failed',
                        'upload_result': {
                            'success': False,
                            'error': upload_error
                        },
                        'face_compare_result': face_compare_result,
                        'metadata': {
                            'device_id': device_id,
                            'collection_id': collection_id,
                            'timestamp': timestamp,
                            'timezone': 'Vietnam (GMT+7)'
                        }
                    }

        except Exception as e:
            print(f"Error processing request: {str(e)}")
            response_message_body = {
                'status': 'error',
                'message': 'Error processing request',
                'error': str(e)
            }

    # Gửi response về cho client WebSocket
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