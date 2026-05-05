+++
title = "Strix 项目部署"
date = '2025-10-02T00:00:00+08:00'
draft = false
description = "记录 Strix 在 Linux 与 Docker 环境中的部署前提、权限要求和初始化脚本。"
image = "images/article-banners/strix-deployment.jpg"
categories = ["工具汇总", "安全搭建"]
tags = ["Strix", "Docker", "AI工具"]
+++

> 注：以下部署记录保留原有思路，环境变量中的密钥均使用占位符示例。

## 部署前提与坑点


1. Docker 环境通常需要 root 权限运行，也可以直接使用 docker-compose 或 docker 命令完成部署；

2. 由于 Docker 运行环境限制，安装应用所需的 pipx 往往也需要在 root 环境下安装后才能直接运行；

3. 如果使用低权限用户，请先确认当前用户已加入 docker 组。

```
sudo usermod -aG docker $USER
newgrp docker

#检查pipx的环境变量继承，有时 pipx 创建的虚拟环境没有继承到 DOCKER_HOST 或 socket 权限。可以在 ~/.bashrc 或 ~/.zshrc
export DOCKER_HOST=unix:///var/run/docker.sock
```

## 一键初始化脚本

```bash
#!/bin/bash
#
# Strix 初始化脚本
# 功能：
# 1. 检查 Docker 是否安装并运行
# 2. 检查当前用户是否在 docker 组
# 3. 配置 AI Provider 环境变量
# 4. 输出最终环境状态

echo "=== [1] 检查 Docker 安装 ==="
if ! command -v docker &> /dev/null; then
    echo "❌ 未检测到 Docker，请先安装: sudo apt install docker.io -y"
    exit 1
else
    echo "✅ Docker 已安装: $(docker --version)"
fi

echo "=== [2] 检查 Docker 服务状态 ==="
if ! systemctl is-active --quiet docker; then
    echo "⚠️ Docker 未运行，尝试启动..."
    sudo systemctl start docker
    sleep 2
    if ! systemctl is-active --quiet docker; then
        echo "❌ Docker 启动失败，请手动检查 systemctl status docker"
        exit 1
    fi
fi
echo "✅ Docker 服务正在运行"

echo "=== [3] 检查用户是否在 docker 组 ==="
if groups $USER | grep -qw docker; then
    echo "✅ 用户已在 docker 组"
else
    echo "⚠️ 用户未在 docker 组，正在添加..."
    sudo usermod -aG docker $USER
    echo "👉 请重新登录或执行 'newgrp docker' 以生效"
fi

echo "=== [4] 配置 AI Provider 环境变量 ==="
# 这里根据你使用的 LLM Provider 修改
export STRIX_LLM="openai/gpt-5"
export LLM_API_KEY="your-openai-api-key"

# 如果你有 Perplexity Key，可以加上
# export PERPLEXITY_API_KEY="your-perplexity-api-key"

echo "✅ 已配置 STRIX_LLM=$STRIX_LLM"
echo "✅ 已配置 LLM_API_KEY (已隐藏)"

echo "=== [5] 测试 docker ps ==="
if docker ps &> /dev/null; then
    echo "✅ Docker 可正常访问"
else
    echo "❌ Docker 无法访问，请检查 /var/run/docker.sock 权限"
fi

echo "=== 初始化完成，可以运行 Strix ==="
```

4.api配置，如果只是为了测试，可以直接在命令行中输入

```
export STRIX_LLM="openai/gpt-5"
export LLM_API_KEY="your-api-key"
```

如果需要长期生效，可以写入 zsh/bash 配置文件，或直接注入到 Docker 运行环境中。
