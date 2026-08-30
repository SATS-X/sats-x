output "public_ip" {
  description = "IP tĩnh của instance (Elastic IP)."
  value       = aws_eip.this.public_ip
}

output "backend_url" {
  description = "URL để Lambda / frontend gọi vào backend."
  value       = "http://${aws_eip.this.public_ip}:${var.app_port}"
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
