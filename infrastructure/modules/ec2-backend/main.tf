# EC2 free-tier chạy backend Express + Postgres bằng docker-compose — cùng stack
# với máy dev cục bộ, không cần viết lại gì cho serverless. Đổi lại phải tự SSH
# vào để triển khai code + secret (xem user_data.sh.tpl / MOTD sau khi apply).

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_vpc" "default" {
  default = true
}

# --- SSH key -----------------------------------------------------------------
# Sinh cặp khoá bằng Terraform thay vì bắt người dùng tự tạo trước — private key
# chỉ nằm trong state (đã mã hoá trên S3) và output sensitive, không bao giờ ghi
# ra file trong repo.

resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "this" {
  key_name   = "${var.name_prefix}-backend-key"
  public_key = tls_private_key.ssh.public_key_openssh
}

# --- Security group ------------------------------------------------------------

resource "aws_security_group" "this" {
  name        = "${var.name_prefix}-backend-sg"
  description = "SSH gioi han IP + cong app mo cong khai cho Lambda va trinh duyet goi vao"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "Backend API"
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Frontend (nginx)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- Instance --------------------------------------------------------------

resource "aws_instance" "this" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.this.key_name
  vpc_security_group_ids = [aws_security_group.this.id]

  root_block_device {
    volume_size = var.root_volume_gb
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    app_port = var.app_port
  })

  tags = {
    Name = "${var.name_prefix}-backend"
  }
}

# --- Elastic IP --------------------------------------------------------------
# Giữ cố định địa chỉ qua các lần restart instance — miễn phí khi đang gắn vào
# instance đang chạy (chỉ tốn phí nếu tạo EIP mà không gắn, hoặc instance dừng).

resource "aws_eip" "this" {
  instance = aws_instance.this.id
  domain   = "vpc"

  tags = {
    Name = "${var.name_prefix}-backend"
  }
}
