resource "aws_apigatewayv2_api" "this" {
  name                       = var.api_name
  protocol_type              = "WEBSOCKET"
  route_selection_expression = var.route_selection_expression
}

resource "aws_apigatewayv2_integration" "this" {
  for_each = var.routes

  api_id                    = aws_apigatewayv2_api.this.id
  integration_type          = "AWS_PROXY"
  integration_uri           = each.value.lambda_invoke_arn
  integration_method        = "POST"
  timeout_milliseconds      = var.integration_timeout_ms
  passthrough_behavior      = "WHEN_NO_MATCH"
  content_handling_strategy = "CONVERT_TO_TEXT"
}

resource "aws_apigatewayv2_route" "this" {
  for_each = var.routes

  api_id    = aws_apigatewayv2_api.this.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.this[each.key].id}"
}

resource "aws_lambda_permission" "this" {
  for_each = var.routes

  statement_id  = "AllowExecutionFromWebSocketAPI-${replace(each.key, "$", "")}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/${each.key}"
}

resource "aws_cloudwatch_log_group" "access" {
  name              = "/aws/apigateway/${var.api_name}"
  retention_in_days = var.log_retention_days
}

data "aws_iam_policy_document" "apigw_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "apigw_cloudwatch" {
  name               = "${var.api_name}-apigw-logs"
  assume_role_policy = data.aws_iam_policy_document.apigw_assume.json
}

resource "aws_iam_role_policy_attachment" "apigw_cloudwatch" {
  role       = aws_iam_role.apigw_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "this" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch.arn
}

resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = var.stage_name
  auto_deploy = true

  depends_on = [aws_api_gateway_account.this]

  default_route_settings {
    data_trace_enabled       = false
    detailed_metrics_enabled = true
    logging_level            = "INFO"
    throttling_rate_limit    = var.throttle_rate_limit
    throttling_burst_limit   = var.throttle_burst_limit
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.access.arn

    format = jsonencode({
      requestId        = "$context.requestId"
      connectionId     = "$context.connectionId"
      eventType        = "$context.eventType"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
      requestTime      = "$context.requestTime"
      responseLatency  = "$context.responseLatency"
      integrationError = "$context.integrationErrorMessage"
      sourceIp         = "$context.identity.sourceIp"
    })
  }
}
