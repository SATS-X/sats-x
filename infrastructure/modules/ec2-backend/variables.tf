variable "name_prefix" {
  description = "Tiền tố tên tài nguyên."
  type        = string
}

variable "instance_type" {
  description = "Loại instance. t3.micro nằm trong AWS Free Tier (750 giờ/tháng, 12 tháng đầu)."
  type        = string
  default     = "t3.micro"
}

variable "app_port" {
  description = "Cổng Express lắng nghe bên trong container."
  type        = number
  default     = 4000
}

variable "ssh_allowed_cidr" {
  description = <<-EOT
    CIDR được phép SSH vào (cổng 22). Mặc định giới hạn theo IP hiện tại của máy
    chạy terraform lúc apply — nếu SSH từ máy/mạng khác, đổi biến này rồi apply lại,
    hoặc set "0.0.0.0/0" (mở cho mọi nơi, không khuyến khích).
  EOT
  type        = string
}

variable "root_volume_gb" {
  description = "Dung lượng ổ đĩa gốc (GB). 30GB là mức tối đa miễn phí trong Free Tier."
  type        = number
  default     = 20
}
