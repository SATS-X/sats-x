variable "name_prefix" {
  description = "Collection name prefix. Must match the pattern used by ESP32-CAM firmware."
  type        = string
}

variable "class_ids" {
  description = "List of class identifiers."
  type        = list(string)
}

resource "aws_rekognition_collection" "this" {
  for_each = toset(var.class_ids)

  collection_id = "${var.name_prefix}-${each.value}"

  tags = {
    ClassId = each.value
  }
}

output "collection_ids" {
  description = "Map of class ID to Rekognition collection ID."
  value       = { for k, v in aws_rekognition_collection.this : k => v.collection_id }
}

output "collection_arns" {
  description = "List of collection ARNs for IAM policies."
  value       = [for v in aws_rekognition_collection.this : v.arn]
}
