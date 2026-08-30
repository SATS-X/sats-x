variable "bucket_name" {
  description = "Globally unique bucket name."
  type        = string
}

variable "cors_allowed_origins" {
  description = "Origins allowed to call S3 directly via presigned URLs."
  type        = list(string)
  default     = []
}

variable "history_retention_days" {
  description = "Days to keep images in history/. 0 = keep forever."
  type        = number
  default     = 365
}

variable "enable_access_logging" {
  description = "Create a separate log bucket and enable server access logging."
  type        = bool
  default     = false
}

variable "force_destroy" {
  description = "Allow terraform destroy to delete a bucket that still contains objects. Only enable in dev."
  type        = bool
  default     = false
}

variable "noncurrent_version_retention_days" {
  description = "Days to keep old versions after an object is overwritten or deleted."
  type        = number
  default     = 30
}
