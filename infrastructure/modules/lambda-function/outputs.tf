output "function_name" {
  description = "Lambda function name."
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "Lambda function ARN."
  value       = aws_lambda_function.this.arn
}

output "invoke_arn" {
  description = "Invoke ARN for API Gateway integration."
  value       = aws_lambda_function.this.invoke_arn
}

output "role_name" {
  description = "IAM role name. Use to attach additional policies outside the module."
  value       = aws_iam_role.this.name
}

output "role_arn" {
  description = "IAM role ARN."
  value       = aws_iam_role.this.arn
}

output "log_group_name" {
  description = "CloudWatch log group name."
  value       = aws_cloudwatch_log_group.this.name
}
