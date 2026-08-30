output "api_id" {
  description = "WebSocket API ID."
  value       = aws_apigatewayv2_api.this.id
}

output "websocket_url" {
  description = "WebSocket URL for frontend and ESP32-CAM firmware."
  value       = "${aws_apigatewayv2_api.this.api_endpoint}/${var.stage_name}"
}

output "execution_arn" {
  description = "Execution ARN for granting Lambda @connections permissions."
  value       = aws_apigatewayv2_api.this.execution_arn
}

output "connections_arn" {
  description = "ARN pattern for execute-api:ManageConnections permission."
  value       = "${aws_apigatewayv2_api.this.execution_arn}/${var.stage_name}/POST/@connections/*"
}

output "stage_name" {
  description = "Stage name."
  value       = aws_apigatewayv2_stage.this.name
}
