#!/bin/bash
# Cloud-init: chỉ cài Docker + công cụ nền. KHÔNG tự động clone repo hay ghi secret
# ở đây — user_data nằm trong EC2 instance metadata, ai có quyền đọc metadata/console
# cũng đọc được, nên bước triển khai code + .env thật phải làm thủ công qua SSH.
set -euo pipefail

apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

usermod -aG docker ubuntu
systemctl enable --now docker

# Cài sẵn gh CLI — repo backend là PRIVATE nên `git clone` thường
# không xác thực được; `gh auth login` (device flow, làm thủ công qua SSH) +
# `gh repo clone` là cách sạch nhất trên máy chủ headless không có trình duyệt.
mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /etc/apt/keyrings/githubcli-archive-keyring.gpg
chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  > /etc/apt/sources.list.d/github-cli.list
apt-get update -y
apt-get install -y gh

cat > /etc/motd <<'EOF'
=== attendance-system backend host ===

Docker + gh CLI đã cài sẵn. Repo là PRIVATE nên dùng gh, không dùng git clone
thường (không xác thực được). Các bước còn lại làm thủ công (cần secret thật,
user_data không được phép chạm vào — ai đọc EC2 instance metadata cũng đọc được):

  1. gh auth login   # hiện link + mã, mở trên điện thoại/máy khác để xác nhận
  2. gh repo clone tranvix0910/backend && cd backend
  3. cp .env.prod.example .env   # điền DB_PASSWORD / JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / CORS_ORIGINS thật
  4. docker compose -f docker-compose.prod.yml up -d --build
  5. (chỉ lần đầu) docker compose -f docker-compose.prod.yml exec app npm run create-admin -- <teacher_id> "<tên>" <email> <mật khẩu>

Ứng dụng lắng nghe ở cổng ${app_port} — security group đã mở sẵn cổng này ra internet.
EOF

echo "cloud-init hoàn tất" > /var/log/cloud-init-done.log
