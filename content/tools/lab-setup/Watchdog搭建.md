+++
title = "Watchdog 搭建记录"
date = '2022-03-21T00:00:00+08:00'
draft = false
description = "记录 Watchdog 资产扫描与登记平台在 Ubuntu 环境下的部署步骤与启动方式。"
image = "images/article-banners/watchdog-deployment.jpg"
categories = ["工具汇总", "安全搭建"]
tags = ["Watchdog", "资产扫描", "Python"]
+++

> 注：文中的测试账户、密码与接口配置均已替换为占位符，请按实际环境填写。

## 项目地址

https://github.com/CTF-MissFeng/Watchdog

以下记录以 Ubuntu 18 为例。

## 一、环境及软件安装

本应用依赖 Python 3 运行环境，以下步骤默认系统已具备基础 Python 能力。

可参考下述方式准备 Python 3 环境：

```bash
# 1、安装python3环境,这里推荐使用minicoda方式安装：
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
sh Miniconda3-latest-Linux-x86_64.sh  # 根据提示进行安装

# 2、默认miniconda环境为python3.7，这里新创建一个python3.8环境
conda create --name python python=3.8  # 创建环境
conda activate python   # 激活环境，现在你应该在python3.8环境中
```

安装必要依赖环境

```bash
apt-get update
apt install build-essential libssl-dev libffi-dev python3-dev  # python相关环境
apt install nmap  # 安装nmap
sudo apt-get install chromium-browser  # 安装chromium浏览器(该部分可能需要耐心等待片刻，部分服务需要重启)
```

安装本项目相关文件

```bash
git clone https://github.com/CTF-MissFeng/Watchdog.git #克隆相应项目
cd Watchdog #到相应目录下
pip install -r requirements.txt #检查安装对应依赖
```

## 二、数据库安装

安装postgresql数据库

```bash
apt install postgresql postgresql-contrib  # 安装postgres数据库
sudo -u postgres psql  # 进入psql命令行
\password postgres  # 设置“postgres"用户的密码，如需要建立用户名密码也可
```

数据库创建

```bash
$ cd /lib/PostgreSQL/12/bin/ # 12为对应版本号，可根据实际情况修改
$ createdb -h localhost -p 5432 -U postgres src  #用超级管理员创建数据库，在postgres用户下的src实例库
password ******  #输入之前输入的密码
sudo -u postgres psql  # 进入psql命令行
\l #查看是否建立对应的数据库
\q #推出psql 命令行
```

修改配置文件

```bash
vi Watchdog/web/config.py  # 修改数据库连接配置
vi Watchdog/client/database.py  # 修改数据库连接配置

# 数据库连接地址格式可参考以下示例进行调整
psql postgres://username:password@host:port/dbname
psql -U username -h hostname -p port -d dbname
```

## 三、运行 Watchdog

```bash
cd Watchdog
export FLASK_APP=app.py:APP  # 配置flaskAPP
flask --help  # 现在你应该可以Commands看到有3个自定义命令
flask createdb  # 创建数据库
flask createuser  # 创建测试账户，自定义测试账户 / <请替换为自定义密码>
flask run -p 80 -h 0.0.0.0  # 启动后，打开该服务器外网ip，访问http://外网ip 是否可以成功访问并登录web环境，端口号可自行定义
Control + C 结束flask运行，
！！首先修改必要配置文件后，进行启动

配置并启动各工具模块：子域名扫描、端口扫描、URL探测、xray扫描
vi client/subdomain/oneforall/config.py  # 必须配置shodan api，其他参数自己选填

nohup flask run -p 80 -h 0.0.0.0 > web.log 2>&1 &  #使用后台运行，端口可自行定义

# 启动子域名扫描
cd client/subdomain/oneforall
nohup python -u sbudomain_run.py > dns.log 2>&1 &
cat dns.log  # 查看日志是否正常，显示启动为正常

# 启动端口扫描
cd client/portscan
nohup python -u portscan_run.py > port.log 2>&1 &
cat port.log  # 查看日志是否正常，显示启动为正常

# 启动url扫描
cd client/urlscan/url_probe
nohup python -u urlscan_run.py > url.log 2>&1 &
cat url.log # 查看日志是否正常，显示启动为正常

# 启动xray
cd client/urlscan/xray
nohup python -u xray_run.py > xray.log 2>&1 &
cat xray.log # 查看日志是否正常，显示启动为正常

```
