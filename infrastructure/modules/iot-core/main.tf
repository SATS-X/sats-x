variable "name_prefix" {
  description = "Prefix for thing and policy names."
  type        = string
}

variable "devices" {
  description = "Map of device name to subscribe/publish topic lists."
  type = map(object({
    subscribe_topics = list(string)
    publish_topics   = list(string)
  }))
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id             = data.aws_caller_identity.current.account_id
  region                 = data.aws_region.current.region
  topic_arn_prefix       = "arn:aws:iot:${local.region}:${local.account_id}:topic"
  topicfilter_arn_prefix = "arn:aws:iot:${local.region}:${local.account_id}:topicfilter"
  client_arn_prefix      = "arn:aws:iot:${local.region}:${local.account_id}:client"
}

resource "aws_iot_thing" "this" {
  for_each = var.devices

  name = "${var.name_prefix}-${each.key}"
}

resource "aws_iot_certificate" "this" {
  for_each = var.devices

  active = true
}

resource "aws_iot_thing_principal_attachment" "this" {
  for_each = var.devices

  thing     = aws_iot_thing.this[each.key].name
  principal = aws_iot_certificate.this[each.key].arn
}

data "aws_iam_policy_document" "device" {
  for_each = var.devices

  statement {
    sid       = "Connect"
    effect    = "Allow"
    actions   = ["iot:Connect"]
    resources = ["${local.client_arn_prefix}/${var.name_prefix}-${each.key}"]
  }

  dynamic "statement" {
    for_each = length(each.value.publish_topics) > 0 ? [1] : []
    content {
      sid       = "Publish"
      effect    = "Allow"
      actions   = ["iot:Publish"]
      resources = [for t in each.value.publish_topics : "${local.topic_arn_prefix}/${t}"]
    }
  }

  dynamic "statement" {
    for_each = length(each.value.subscribe_topics) > 0 ? [1] : []
    content {
      sid       = "Subscribe"
      effect    = "Allow"
      actions   = ["iot:Subscribe"]
      resources = [for t in each.value.subscribe_topics : "${local.topicfilter_arn_prefix}/${t}"]
    }
  }

  dynamic "statement" {
    for_each = length(each.value.subscribe_topics) > 0 ? [1] : []
    content {
      sid       = "Receive"
      effect    = "Allow"
      actions   = ["iot:Receive"]
      resources = [for t in each.value.subscribe_topics : "${local.topic_arn_prefix}/${t}"]
    }
  }
}

resource "aws_iot_policy" "this" {
  for_each = var.devices

  name   = "${var.name_prefix}-${each.key}-policy"
  policy = data.aws_iam_policy_document.device[each.key].json
}

resource "aws_iot_policy_attachment" "this" {
  for_each = var.devices

  policy = aws_iot_policy.this[each.key].name
  target = aws_iot_certificate.this[each.key].arn
}

data "aws_iot_endpoint" "this" {
  endpoint_type = "iot:Data-ATS"
}

output "iot_endpoint" {
  description = "MQTT endpoint for ESP32 firmware configuration."
  value       = data.aws_iot_endpoint.this.endpoint_address
}

output "thing_names" {
  description = "Map of device key to thing name (also used as MQTT client ID)."
  value       = { for k, v in aws_iot_thing.this : k => v.name }
}

output "certificate_pems" {
  description = "Public certificate for each device."
  value       = { for k, v in aws_iot_certificate.this : k => v.certificate_pem }
  sensitive   = true
}

output "private_keys" {
  description = "Private key for each device. Retrieve via: terraform output -json private_keys"
  value       = { for k, v in aws_iot_certificate.this : k => v.private_key }
  sensitive   = true
}
