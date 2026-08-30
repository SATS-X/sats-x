terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.6"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # State dùng chung qua S3, không nằm trên máy cá nhân — bắt buộc để nhiều người
  # (hoặc CI) cùng chạy terraform mà không ghi đè state của nhau. Khoá ghi đồng thời
  # bằng use_lockfile (S3 native locking, Terraform >= 1.10), không cần DynamoDB.
  backend "s3" {
    bucket       = "attendance-system-tfstate-022499043310"
    key          = "attendance-system/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }
}
