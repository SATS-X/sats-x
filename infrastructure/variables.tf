variable "project" {
  description = "Project name used as prefix for all resources."
  type        = string
  default     = "attendance-system"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,30}$", var.project))
    error_message = "Must be lowercase alphanumeric with hyphens, 3-31 characters."
  }
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region. Rekognition and IoT Core must be in the same region as Lambda."
  type        = string
  default     = "ap-southeast-1"
}

variable "aws_profile" {
  description = "AWS CLI profile name. Set to null when running on CI with IAM roles."
  type        = string
  default     = null
}

variable "s3_bucket_name_override" {
  description = "Override the auto-generated S3 bucket name. Leave null for <project>-<env>-<account_id>."
  type        = string
  default     = null
}

variable "cors_allowed_origins" {
  description = "Origins allowed to PUT/GET directly via presigned URLs."
  type        = list(string)
  default     = ["http://localhost:5173"]

  validation {
    condition     = length(var.cors_allowed_origins) > 0
    error_message = "At least one origin is required."
  }
}

variable "history_retention_days" {
  description = "Days to keep attendance images in history/ before deletion. 0 = keep forever."
  type        = number
  default     = 365

  validation {
    condition     = var.history_retention_days == 0 || var.history_retention_days >= 30
    error_message = "Must be 0 or at least 30 days."
  }
}

variable "enable_access_logging" {
  description = "Create a separate bucket for S3 access logs. Recommended for production."
  type        = bool
  default     = false
}

variable "class_ids" {
  description = "List of class IDs. Each class gets its own Rekognition collection."
  type        = list(string)
  default     = ["D22CQCI01-N", "D22CQCI01-B", "D22CQVT01-N"]
}

variable "face_match_threshold" {
  description = "Minimum similarity percentage to consider a face match."
  type        = number
  default     = 95

  validation {
    condition     = var.face_match_threshold >= 80 && var.face_match_threshold <= 100
    error_message = "Threshold should be between 80 and 100."
  }
}

variable "lambda_runtime" {
  description = "Python runtime for Lambda functions."
  type        = string
  default     = "python3.12"
}

variable "lambda_log_retention_days" {
  description = "Days to retain Lambda CloudWatch logs."
  type        = number
  default     = 30
}

variable "ssh_allowed_cidr" {
  description = <<-EOT
    CIDR được phép SSH vào EC2 backend (vd "203.0.113.5/32"). Không có default vì
    IP của mỗi người khác nhau — bắt buộc truyền vào lúc apply:
      terraform apply -var="ssh_allowed_cidr=$(curl -s https://checkip.amazonaws.com)/32"
  EOT
  type        = string
}

variable "backend_service_token" {
  description = "Service token for Lambda to call backend API. Pass via TF_VAR_backend_service_token."
  type        = string
  default     = ""
  sensitive   = true
}

variable "api_stage_name" {
  description = "WebSocket API stage name. Appears in the URL: wss://.../<stage>."
  type        = string
  default     = "production"
}

variable "api_throttle_rate_limit" {
  description = "Requests per second allowed on the stage."
  type        = number
  default     = 50
}

variable "api_throttle_burst_limit" {
  description = "Maximum concurrent requests during a burst."
  type        = number
  default     = 100
}

variable "iot_devices" {
  description = "ESP32 devices that need IoT Core certificates."
  type = map(object({
    subscribe_topics = list(string)
    publish_topics   = list(string)
  }))

  default = {
    "esp32-cam" = {
      subscribe_topics = ["esp32/attendance-system"]
      publish_topics   = ["esp32-cam/attendance-system"]
    }
    "esp32-sensor" = {
      subscribe_topics = ["esp32-cam/attendance-system"]
      publish_topics   = ["esp32/attendance-system"]
    }
  }
}
