output "websocket_url" {
  description = "WebSocket URL for frontend and ESP32-CAM firmware."
  value       = module.websocket_api.websocket_url
}

output "s3_bucket_name" {
  description = "S3 bucket name for student photos and attendance images."
  value       = module.storage.bucket_id
}

output "rekognition_collections" {
  description = "Map of class ID to Rekognition collection ID."
  value       = module.rekognition.collection_ids
}

output "iot_endpoint" {
  description = "MQTT endpoint for ESP32 firmware configuration."
  value       = module.iot.iot_endpoint
}

output "iot_thing_names" {
  description = "Map of device key to IoT thing name (also used as MQTT client ID)."
  value       = module.iot.thing_names
}

output "iot_certificate_pems" {
  description = "Public certificates for each IoT device."
  value       = module.iot.certificate_pems
  sensitive   = true
}

output "iot_private_keys" {
  description = "Private keys for each IoT device. Retrieve with: terraform output -json iot_private_keys"
  value       = module.iot.private_keys
  sensitive   = true
}

output "api_gateway_id" {
  description = "API Gateway WebSocket API ID."
  value       = module.websocket_api.api_id
}

output "backend_public_ip" {
  description = "IP tĩnh của EC2 backend."
  value       = module.ec2_backend.public_ip
}

output "backend_url" {
  description = "URL backend — dùng cho VITE_API_BASE_URL của frontend."
  value       = module.ec2_backend.backend_url
}

output "backend_ssh_command" {
  description = "Lệnh SSH — chạy lệnh ở backend_ssh_key trước để lấy file .pem."
  value       = module.ec2_backend.ssh_command
}

output "backend_ssh_key" {
  description = "Private key SSH. Lưu ra file: terraform output -raw backend_ssh_key > backend-key.pem && chmod 400 backend-key.pem"
  value       = module.ec2_backend.private_key_pem
  sensitive   = true
}
