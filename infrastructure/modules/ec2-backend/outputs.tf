locals {
  # Let's Encrypt không cấp chứng chỉ cho địa chỉ IP, còn sslip.io phân giải
  # "52-220-6-142.sslip.io" về đúng IP đó mà không cần mua tên miền.
  site_address = "${replace(aws_eip.this.public_ip, ".", "-")}.sslip.io"
}

output "public_ip" {
  description = "IP tĩnh của instance (Elastic IP)."
  value       = aws_eip.this.public_ip
}

output "backend_url" {
  description = "URL HTTPS để Lambda / frontend gọi vào backend."
  value       = "https://${local.site_address}"
}

output "site_address" {
  description = "Tên miền miễn phí trỏ về Elastic IP (sslip.io); dùng làm SITE_ADDRESS cho Caddy."
  value       = local.site_address
}

output "ssh_command" {
  description = "Lệnh SSH vào instance — lưu private_key_pem ra file trước (xem output đó)."
  value       = "ssh -i backend-key.pem ubuntu@${aws_eip.this.public_ip}"
}

output "private_key_pem" {
  description = <<-EOT
    Private key SSH — lấy bằng: terraform output -raw private_key_pem > backend-key.pem && chmod 400 backend-key.pem
    Không in ra terminal/log thường, không commit file .pem lên git.
  EOT
  value       = tls_private_key.ssh.private_key_pem
  sensitive   = true
}
