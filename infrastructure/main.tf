module "storage" {
  source = "./modules/s3-bucket"

  bucket_name            = local.bucket_name
  cors_allowed_origins   = var.cors_allowed_origins
  history_retention_days = var.history_retention_days
  enable_access_logging  = var.enable_access_logging
  force_destroy          = var.environment == "dev"
}

module "rekognition" {
  source = "./modules/rekognition-collections"

  name_prefix = var.project
  class_ids   = var.class_ids
}

module "ec2_backend" {
  source = "./modules/ec2-backend"

  name_prefix      = local.name_prefix
  ssh_allowed_cidr = var.ssh_allowed_cidr
}

locals {
  common_env = {
    BUCKET_NAME          = module.storage.bucket_id
    COLLECTION_PREFIX    = var.project
    FACE_MATCH_THRESHOLD = tostring(var.face_match_threshold)
    ENVIRONMENT          = var.environment
    LOG_LEVEL            = var.environment == "prod" ? "INFO" : "DEBUG"
  }

  backend_env = {
    # Trỏ thẳng vào EC2 vừa tạo — không cần điền tay var.backend_api_url nữa.
    BACKEND_API_URL       = module.ec2_backend.backend_url
    BACKEND_SERVICE_TOKEN = var.backend_service_token
  }
}

module "lambda_connection" {
  source = "./modules/lambda-function"

  function_name      = "${local.name_prefix}-connection"
  description        = "Handles $connect / $disconnect / $default WebSocket lifecycle"
  source_dir         = "${path.module}/lambda/connection"
  runtime            = var.lambda_runtime
  timeout            = 10
  memory_size        = 128
  log_retention_days = var.lambda_log_retention_days

  environment_variables = local.common_env
}

module "lambda_attendance" {
  source = "./modules/lambda-function"

  function_name      = "${local.name_prefix}-attendance"
  description        = "Routes compare/upload - stores images and performs face recognition"
  source_dir         = "${path.module}/lambda/attendance"
  runtime            = var.lambda_runtime
  timeout            = 30
  memory_size        = 1024
  log_retention_days = var.lambda_log_retention_days

  environment_variables = merge(local.common_env, local.backend_env)

  policy_statements = [
    {
      sid       = "WriteAttendanceImages"
      actions   = ["s3:PutObject"]
      resources = ["${module.storage.bucket_arn}/history/*"]
    },
    {
      sid       = "ReadAttendanceImages"
      actions   = ["s3:GetObject"]
      resources = ["${module.storage.bucket_arn}/history/*"]
    },
    {
      sid       = "SearchFaces"
      actions   = ["rekognition:SearchFacesByImage"]
      resources = module.rekognition.collection_arns
    },
  ]
}

module "lambda_schedule" {
  source = "./modules/lambda-function"

  function_name      = "${local.name_prefix}-schedule"
  description        = "Route schedule - fetches class schedule from backend API"
  source_dir         = "${path.module}/lambda/schedule"
  runtime            = var.lambda_runtime
  timeout            = 15
  memory_size        = 256
  log_retention_days = var.lambda_log_retention_days

  environment_variables = merge(local.common_env, local.backend_env)
}

module "lambda_face_management" {
  source = "./modules/lambda-function"

  function_name      = "${local.name_prefix}-face-management"
  description        = "Routes addFace/deleteFace/listFaces - manages Rekognition collections"
  source_dir         = "${path.module}/lambda/face_management"
  runtime            = var.lambda_runtime
  timeout            = 30
  memory_size        = 512
  log_retention_days = var.lambda_log_retention_days

  environment_variables = local.common_env

  policy_statements = [
    {
      sid       = "ManageStudentPhotos"
      actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
      resources = ["${module.storage.bucket_arn}/classes/*"]
    },
    {
      sid       = "ListBucket"
      actions   = ["s3:ListBucket"]
      resources = [module.storage.bucket_arn]
    },
    {
      sid = "ManageFaces"
      actions = [
        "rekognition:IndexFaces",
        "rekognition:DeleteFaces",
        "rekognition:ListFaces",
        "rekognition:DescribeCollection",
      ]
      resources = module.rekognition.collection_arns
    },
  ]
}

module "lambda_trigger" {
  source = "./modules/lambda-function"

  function_name      = "${local.name_prefix}-trigger"
  description        = "Route triggerCapture - ra lenh chup anh tu xa qua MQTT, tai dung co che cam bien khoang cach da co san tren firmware"
  source_dir         = "${path.module}/lambda/trigger"
  runtime            = var.lambda_runtime
  timeout            = 10
  memory_size        = 128
  log_retention_days = var.lambda_log_retention_days

  environment_variables = merge(local.common_env, {
    IOT_ENDPOINT  = module.iot.iot_endpoint
    CAPTURE_TOPIC = "esp32/attendance-system"
  })

  policy_statements = [
    {
      sid       = "PublishCaptureCommand"
      actions   = ["iot:Publish"]
      resources = ["arn:aws:iot:${local.region}:${local.account_id}:topic/esp32/attendance-system"]
    },
  ]
}

module "websocket_api" {
  source = "./modules/websocket-api"

  api_name             = "${local.name_prefix}-ws"
  stage_name           = var.api_stage_name
  throttle_rate_limit  = var.api_throttle_rate_limit
  throttle_burst_limit = var.api_throttle_burst_limit
  log_retention_days   = var.lambda_log_retention_days

  routes = {
    "$connect" = {
      lambda_invoke_arn    = module.lambda_connection.invoke_arn
      lambda_function_name = module.lambda_connection.function_name
    }
    "$disconnect" = {
      lambda_invoke_arn    = module.lambda_connection.invoke_arn
      lambda_function_name = module.lambda_connection.function_name
    }
    "$default" = {
      lambda_invoke_arn    = module.lambda_connection.invoke_arn
      lambda_function_name = module.lambda_connection.function_name
    }
    "compare" = {
      lambda_invoke_arn    = module.lambda_attendance.invoke_arn
      lambda_function_name = module.lambda_attendance.function_name
    }
    "upload" = {
      lambda_invoke_arn    = module.lambda_attendance.invoke_arn
      lambda_function_name = module.lambda_attendance.function_name
    }
    "schedule" = {
      lambda_invoke_arn    = module.lambda_schedule.invoke_arn
      lambda_function_name = module.lambda_schedule.function_name
    }
    # Cấp presigned PUT URL để frontend đẩy ảnh thẳng lên S3. Ảnh khuôn mặt
    # không thể đi qua WebSocket: API Gateway đóng kết nối (code 1009) với mọi
    # frame > 32KB, mà trình duyệt không tự chia nhỏ frame.
    "getUploadUrl" = {
      lambda_invoke_arn    = module.lambda_face_management.invoke_arn
      lambda_function_name = module.lambda_face_management.function_name
    }
    "addFace" = {
      lambda_invoke_arn    = module.lambda_face_management.invoke_arn
      lambda_function_name = module.lambda_face_management.function_name
    }
    "deleteFace" = {
      lambda_invoke_arn    = module.lambda_face_management.invoke_arn
      lambda_function_name = module.lambda_face_management.function_name
    }
    "deleteFaceAndImage" = {
      lambda_invoke_arn    = module.lambda_face_management.invoke_arn
      lambda_function_name = module.lambda_face_management.function_name
    }
    "listFaces" = {
      lambda_invoke_arn    = module.lambda_face_management.invoke_arn
      lambda_function_name = module.lambda_face_management.function_name
    }
    "getCollectionInfo" = {
      lambda_invoke_arn    = module.lambda_face_management.invoke_arn
      lambda_function_name = module.lambda_face_management.function_name
    }
    "triggerCapture" = {
      lambda_invoke_arn    = module.lambda_trigger.invoke_arn
      lambda_function_name = module.lambda_trigger.function_name
    }
    # Client gửi định kỳ để giữ kết nối sống — không có route này thì NAT/firewall
    # phía client thường âm thầm cắt kết nối idle trước khi API Gateway timeout
    # (10 phút), khiến client giữ 1 socket "chết" mà không biết cho tới khi gửi
    # gì đó thì mất luôn, không có lỗi rõ ràng (xem lambda/connection/index.py).
    "ping" = {
      lambda_invoke_arn    = module.lambda_connection.invoke_arn
      lambda_function_name = module.lambda_connection.function_name
    }
  }
}

data "aws_iam_policy_document" "manage_connections" {
  statement {
    sid       = "PostToConnection"
    effect    = "Allow"
    actions   = ["execute-api:ManageConnections"]
    resources = [module.websocket_api.connections_arn]
  }
}

resource "aws_iam_role_policy" "manage_connections" {
  for_each = {
    attendance      = module.lambda_attendance.role_name
    schedule        = module.lambda_schedule.role_name
    face_management = module.lambda_face_management.role_name
    trigger         = module.lambda_trigger.role_name
  }

  name   = "${local.name_prefix}-manage-connections"
  role   = each.value
  policy = data.aws_iam_policy_document.manage_connections.json
}

module "iot" {
  source = "./modules/iot-core"

  name_prefix = local.name_prefix
  devices     = var.iot_devices
}
