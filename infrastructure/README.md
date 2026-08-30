# ☁️ Attendance System — AWS Cloud Infrastructure (Terraform)

[![Terraform](https://img.shields.io/badge/Terraform-1.5%2B-7B42BC?style=flat-square&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900?style=flat-square&logo=amazonwebservices&logoColor=white)](https://aws.amazon.com/)
[![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-Python_3.12-FF9900?style=flat-square&logo=awslambda&logoColor=white)](https://aws.amazon.com/lambda/)
[![Amazon Rekognition](https://img.shields.io/badge/Amazon-Rekognition-527FFF?style=flat-square&logo=amazonrekognition&logoColor=white)](https://aws.amazon.com/rekognition/)
[![AWS IoT Core](https://img.shields.io/badge/AWS-IoT_Core-232F3E?style=flat-square&logo=amazons3&logoColor=white)](https://aws.amazon.com/iot-core/)
[![Amazon S3](https://img.shields.io/badge/Amazon-S3-569A31?style=flat-square&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)

> **Fully Modularized Infrastructure as Code (IaC)** provisioning resilient, event-driven serverless backbones, biometric AI collections, edge IoT device credentials, and application hosts on Amazon Web Services.

The **Attendance System Infrastructure** repository contains the complete declarative Terraform configuration that provisions and interconnects the cloud components powering the Smart Facial Attendance System. Every component is encapsulated in reusable modules adhering strictly to the **AWS Well-Architected Framework** and **Least-Privilege Security Principles**.

---

## 📑 Table of Contents

- [Cloud Architecture Overview](#-cloud-architecture-overview)
- [Modular Infrastructure Hierarchy](#-modular-infrastructure-hierarchy)
- [WebSocket Routing & Lambda Matrix](#-websocket-routing--lambda-matrix)
- [Security & IAM Least-Privilege Model](#-security--iam-least-privilege-model)
- [Remote State & Terraform Backend](#-remote-state--terraform-backend)
- [Step-by-Step Provisioning Guide](#-step-by-step-provisioning-guide)
- [Terraform Outputs & Secrets Management](#-terraform-outputs--secrets-management)
- [Part of the Ecosystem](#-part-of-the-ecosystem)

---

## 🏛 Cloud Architecture Overview

The system architecture cleanly separates edge ingestion, real-time bidirectional WebSocket orchestration, serverless facial recognition pipelines, and persistent relational storage:

```mermaid
flowchart TB
    subgraph EdgeDevices["Edge Hardware & Client Tier"]
        ESP_CAM["ESP32-CAM (Camera Node)"]
        ESP_SENSOR["ESP32 (Distance Sensor Node)"]
        WEB_CLIENT["Teacher Dashboard (React Web Client)"]
    end

    subgraph AWSIoT["AWS IoT Core (mTLS)"]
        IOT_BROKER["MQTT Broker\nTopic: esp32/attendance-system"]
    end

    subgraph APIGateway["AWS API Gateway (WebSocket v2)"]
        WSS["WebSocket API ($connect, compare, schedule, addFace, ping, ...)"]
    end

    subgraph LambdaCompute["AWS Lambda Layer (Python 3.12 Serverless)"]
        L_CONN["connection Lambda\n(Lifecycle & Heartbeat)"]
        L_ATT["attendance Lambda\n(Face Recognition & Verification)"]
        L_SCH["schedule Lambda\n(Daily Timetable Proxy)"]
        L_FACE["face_management Lambda\n(Presigned S3 & Rekognition CRUD)"]
        L_TRIG["trigger Lambda\n(MQTT Remote Capture Dispatch)"]
    end

    subgraph AIStorage["Storage & Biometric AI Services"]
        S3_FACES[("AWS S3 Bucket\n/classes (Enrollment)\n/history (Audit Snapshots)")]
        REKOG["Amazon Rekognition Collections\n(Partitioned per Class ID)"]
    end

    subgraph AppHost["AWS EC2 Host (t3.micro Free Tier)"]
        DOCKER_BE["backend\n(Express REST API :4000)"]
        DOCKER_DB[("PostgreSQL 15 Container\n(Internal Network)")]
        DOCKER_NGINX["Nginx Container (:80 / :443)\n(Reverse Proxy + SPA Dist)"]
    end

    ESP_SENSOR -->|mTLS MQTT Publish| IOT_BROKER
    IOT_BROKER -->|mTLS MQTT Subscribe| ESP_CAM
    ESP_CAM -->|WSS Binary / JSON| WSS
    WEB_CLIENT -->|WSS JSON Action Frames| WSS
    WEB_CLIENT -->|HTTPS REST| DOCKER_NGINX
    DOCKER_NGINX --> DOCKER_BE

    WSS --> L_CONN
    WSS --> L_ATT
    WSS --> L_SCH
    WSS --> L_FACE
    WSS --> L_TRIG

    L_ATT -->|rekognition:SearchFacesByImage| REKOG
    L_ATT -->|s3:PutObject /history/*| S3_FACES
    L_ATT -->|POST /api/device/attendance (Service Token)| DOCKER_BE

    L_SCH -->|GET /api/device/schedule (Service Token)| DOCKER_BE

    L_FACE -->|s3:PutObject / Get / Delete| S3_FACES
    L_FACE -->|rekognition:IndexFaces / Delete| REKOG

    L_TRIG -->|iot:Publish| IOT_BROKER

    DOCKER_BE --> DOCKER_DB
```

---

## 📦 Modular Infrastructure Hierarchy

All cloud resources are strictly partitioned into reusable modules under the `modules/` directory:

```
modules/
├── s3-bucket/                # S3 bucket configuration, CORS, versioning, history lifecycle
├── rekognition-collections/  # Dynamic Rekognition face collections provisioned per class
├── lambda-function/          # Standardized serverless template with CloudWatch logs & IAM role
├── websocket-api/            # API Gateway v2 WebSocket, route keys, throttling, and permissions
├── iot-core/                 # IoT Things, X.509 device certificates, and mTLS security policies
└── ec2-backend/              # EC2 t3.micro host, Elastic IP, security group, and SSH key pair
```

### Module Responsibilities

| Module | Core Resources Provisioned | Description |
|:---|:---|:---|
| [`s3-bucket`](file:///Users/vi.trandai/5%20-%20D22CQCI01-N/NCKH%202024%202025/infrastructure/modules/s3-bucket) | `aws_s3_bucket`, `aws_s3_bucket_lifecycle_configuration`, `aws_s3_bucket_cors_configuration` | Stores student reference portraits (`classes/*`) and audit snapshots (`history/*`). Features 90-day automatic expiration lifecycle rules for historical captures. |
| [`rekognition-collections`](file:///Users/vi.trandai/5%20-%20D22CQCI01-N/NCKH%202024%202025/infrastructure/modules/rekognition-collections) | `aws_rekognition_collection` | Biometric vector collections partitioned dynamically per class ID (e.g., `attendance-system-D22CQCI01-N`). |
| [`lambda-function`](file:///Users/vi.trandai/5%20-%20D22CQCI01-N/NCKH%202024%202025/infrastructure/modules/lambda-function) | `aws_lambda_function`, `aws_iam_role`, `aws_cloudwatch_log_group` | Standardized deployment wrapper for Python 3.12 functions with custom memory/timeout profiles and automatic log group pruning. |
| [`websocket-api`](file:///Users/vi.trandai/5%20-%20D22CQCI01-N/NCKH%202024%202025/infrastructure/modules/websocket-api) | `aws_apigatewayv2_api`, `aws_apigatewayv2_route`, `aws_apigatewayv2_integration`, `aws_apigatewayv2_stage` | Bidirectional WebSocket API Gateway with payload-based routing (`$request.body.action`) and request burst/rate throttling. |
| [`iot-core`](file:///Users/vi.trandai/5%20-%20D22CQCI01-N/NCKH%202024%202025/infrastructure/modules/iot-core) | `aws_iot_thing`, `aws_iot_certificate`, `aws_iot_policy`, `aws_iot_policy_attachment` | AWS IoT Core Things, unique X.509 private keys and client certificates for edge ESP32 devices. |
| [`ec2-backend`](file:///Users/vi.trandai/5%20-%20D22CQCI01-N/NCKH%202024%202025/infrastructure/modules/ec2-backend) | `aws_instance`, `aws_eip`, `aws_security_group`, `tls_private_key`, `aws_key_pair` | EC2 `t3.micro` instance with Docker & GitHub CLI pre-installed via cloud-init (`user_data.sh.tpl`), static Elastic IP, and IP-restricted SSH security groups. |

---

## 🔀 WebSocket Routing & Lambda Matrix

AWS API Gateway routes incoming JSON frames based on the top-level `"action"` property. Each route is bound to a dedicated Lambda microservice:

| Route Key | Target Lambda | Memory | Timeout | Role & Operations |
|:---|:---|:---|:---|:---|
| `$connect` / `$disconnect` / `$default` | `connection` | 128 MB | 10s | Manages WebSocket lifecycle, connection registration, and graceful cleanups. |
| `ping` | `connection` | 128 MB | 10s | Client keep-alive heartbeat. Absorbs NAT/firewall keep-alives without echoing back unnecessary frames. |
| `compare` / `upload` | `attendance` | 1024 MB | 30s | Receives JPEG payload from ESP32-CAM, queries Rekognition (`SearchFacesByImage`), archives image to S3 `/history`, and records attendance in Backend API. |
| `schedule` | `schedule` | 256 MB | 15s | Fetches active daily timetable from Backend API and serializes it in the lightweight format expected by ESP32 firmware. |
| `getUploadUrl` | `face_management` | 512 MB | 30s | Generates presigned S3 PUT URLs so web clients can upload high-resolution images directly to S3 without exceeding the 32 KB WebSocket frame limit. |
| `addFace` | `face_management` | 512 MB | 30s | Indexes newly uploaded student portrait into the class Rekognition collection (`IndexFaces`). |
| `deleteFace` / `deleteFaceAndImage` | `face_management` | 512 MB | 30s | Deletes facial vectors from Rekognition and purges image objects from S3 storage. |
| `listFaces` / `getCollectionInfo` | `face_management` | 512 MB | 30s | Inspects indexed face counts and enrolled student metadata in a collection. |
| `triggerCapture` | `trigger` | 128 MB | 10s | Publishes a remote capture trigger message over MQTT topic `esp32/attendance-system` to command the camera node to snap a photo. |

---

## 🛡 Security & IAM Least-Privilege Model

Every Lambda execution role is strictly scoped to the exact AWS resource ARNs and operations it requires:

- **Attendance Lambda**: Restricted to `s3:PutObject` / `s3:GetObject` on `arn:aws:s3:::<bucket>/history/*` and `rekognition:SearchFacesByImage` on provisioned class collection ARNs.
- **Face Management Lambda**: Scoped to `s3:*` on `arn:aws:s3:::<bucket>/classes/*` and `rekognition:IndexFaces` / `DeleteFaces` on class collection ARNs.
- **Trigger Lambda**: Scoped to `iot:Publish` on `arn:aws:iot:<region>:<account>:topic/esp32/attendance-system`.
- **API Gateway Management**: Lambda roles are granted `execute-api:ManageConnections` strictly for the provisioned WebSocket stage ARN.
- **EC2 Security Group**: SSH (port 22) is locked exclusively to the administrator's public IP (`ssh_allowed_cidr`), while HTTP (80) and API (4000) are publicly reachable.

---

## 🗄 Remote State & Terraform Backend

Terraform state is stored remotely in an encrypted Amazon S3 bucket (`attendance-system-tfstate-<account_id>`) with versioning enabled:

```hcl
terraform {
  required_version = ">= 1.5.0"
  backend "s3" {
    bucket  = "attendance-system-tfstate-<ACCOUNT_ID>"
    key     = "attendance-system/dev/terraform.tfstate"
    region  = "ap-southeast-1"
    encrypt = true
  }
}
```

> [!NOTE]
> The state bucket must be bootstrapped once via AWS CLI before running `terraform init`, as Terraform cannot provision the S3 backend it relies on to store the state of that bucket itself.

---

## 🚀 Step-by-Step Provisioning Guide

### Prerequisites
- [AWS CLI v2](https://aws.amazon.com/cli/) configured with administrative credentials (`aws configure`)
- [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) (>= 1.5.0)
- Node.js (for cryptographic token generation)

### 1. Configure Variables
Copy the template variable configuration:
```bash
cp terraform.tfvars.example terraform.tfvars
```
Edit `terraform.tfvars` with your project parameters (class IDs, project prefix, environment).

### 2. Initialize and Apply
Generate a high-entropy `backend_service_token` and fetch your current public IP for SSH whitelisting:

```bash
terraform init

terraform apply \
  -var="backend_service_token=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" \
  -var="ssh_allowed_cidr=$(curl -s https://checkip.amazonaws.com)/32"
```

---

## 🔑 Terraform Outputs & Secrets Management

Upon successful execution, Terraform outputs essential endpoints and credentials required by the other subsystems:

```bash
# Backend REST & WebSocket URLs
terraform output backend_url            # http://<EC2_IP>:4000
terraform output websocket_url          # wss://<API_ID>.execute-api.ap-southeast-1.amazonaws.com/production

# SSH Access to EC2 Host
terraform output backend_ssh_command    # ssh -i backend-key.pem ubuntu@<EC2_IP>
terraform output -raw backend_ssh_key > backend-key.pem && chmod 400 backend-key.pem

# Edge IoT Device Credentials (Export for Firmware)
terraform output -json iot_certificate_pems > certs.json
terraform output -json iot_private_keys > keys.json
```

> [!CAUTION]
> The files `backend-key.pem`, `keys.json`, and `terraform.tfstate` contain raw private keys and cryptographic secrets. They are strictly excluded by `.gitignore` and must never be committed to source control or exposed in CI logs.

---

## 🧩 Part of the Ecosystem

| Repository | Primary Technology | Responsibility |
|:---|:---|:---|
| **`infrastructure`** *(This repo)* | Terraform, AWS Lambda, S3, IoT Core | Serverless AWS Cloud Infrastructure & Pipelines |
| [**`backend`**](../backend) | Express, PostgreSQL, Prisma | Core REST API, Auth, Database ORM, IoT Webhooks |
| [**`frontend`**](../frontend) | React 18, Vite, Tailwind CSS | Teacher Web Dashboard, Live Attendance Monitor |
| [**`iot`**](../iot) | PlatformIO, ESP32, ESP32-CAM | Edge Hardware: Face Capture, LCD UI, Distance Trigger |
| [**`liveness`**](../liveness) | FastAPI, TensorFlow, WebSockets | Real-time Deep Learning Anti-Spoofing Microservice |
