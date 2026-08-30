variable "api_name" {
  description = "WebSocket API name."
  type        = string
}

variable "stage_name" {
  description = "Stage name. Appears in the URL: wss://.../<stage>."
  type        = string
  default     = "production"
}

variable "routes" {
  description = "Map of route key to Lambda invoke ARN and function name."
  type = map(object({
    lambda_invoke_arn    = string
    lambda_function_name = string
  }))
}

variable "route_selection_expression" {
  description = "JSONPath expression in the payload body that determines routing."
  type        = string
  default     = "$request.body.action"
}

variable "throttle_rate_limit" {
  description = "Requests per second."
  type        = number
  default     = 50
}

variable "throttle_burst_limit" {
  description = "Maximum concurrent requests during a burst."
  type        = number
  default     = 100
}

variable "log_retention_days" {
  description = "Days to retain API access logs."
  type        = number
  default     = 30
}

variable "integration_timeout_ms" {
  description = "Integration timeout in milliseconds. API Gateway maximum is 29000."
  type        = number
  default     = 29000

  validation {
    condition     = var.integration_timeout_ms >= 50 && var.integration_timeout_ms <= 29000
    error_message = "Must be between 50 and 29000 ms."
  }
}
