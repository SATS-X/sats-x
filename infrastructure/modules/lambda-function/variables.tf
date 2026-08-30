variable "function_name" {
  description = "Full Lambda function name."
  type        = string
}

variable "description" {
  description = "Function description shown in the AWS Console."
  type        = string
  default     = ""
}

variable "source_dir" {
  description = "Directory containing source code. Zipped automatically during apply."
  type        = string
}

variable "handler" {
  description = "Entry point in <file>.<function> format."
  type        = string
  default     = "index.lambda_handler"
}

variable "runtime" {
  description = "Lambda runtime identifier."
  type        = string
  default     = "python3.12"
}

variable "timeout" {
  description = "Maximum execution time in seconds."
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Memory in MB. Lambda allocates CPU proportional to memory."
  type        = number
  default     = 512
}

variable "environment_variables" {
  description = "Environment variables passed to the function."
  type        = map(string)
  default     = {}
}

variable "log_retention_days" {
  description = "Days to retain CloudWatch logs."
  type        = number
  default     = 30
}

variable "policy_statements" {
  description = "Additional IAM policy statements beyond CloudWatch Logs access."
  type = list(object({
    sid       = string
    actions   = list(string)
    resources = list(string)
  }))
  default = []
}

variable "reserved_concurrency" {
  description = "Reserved concurrent executions. -1 = unrestricted."
  type        = number
  default     = -1
}

variable "enable_tracing" {
  description = "Enable AWS X-Ray active tracing."
  type        = bool
  default     = true
}
