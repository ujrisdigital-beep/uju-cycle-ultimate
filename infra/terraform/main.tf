# Terraform config for cloud deployment (AWS ECS Fargate)
provider "aws" {
  region = var.aws_region
}

variable "aws_region" { default = "us-east-1" }
variable "project_name" { default = "uju-cycle-v4" }
variable "db_password" { sensitive = true }

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "${var.project_name}-vpc" }
}

resource "aws_subnet" "public" {
  count = 2
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = { Name = "${var.project_name}-subnet-${count.index}" }
}

data "aws_availability_zones" "available" {}

# RDS PostgreSQL with pgvector
resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-postgres"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  db_name           = "uju_cycle"
  username          = "uju"
  password          = var.db_password
  skip_final_snapshot = true
  tags = { Name = "${var.project_name}-postgres" }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  tags = { Name = "${var.project_name}-redis" }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

# Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-lb"
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
  security_groups    = [aws_security_group.lb.id]
}

resource "aws_security_group" "lb" {
  vpc_id = aws_vpc.main.id
  ingress {
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

output "lb_url" {
  value = "http://${aws_lb.main.dns_name}"
}

output "db_endpoint" {
  value     = aws_db_instance.postgres.endpoint
  sensitive = true
}
