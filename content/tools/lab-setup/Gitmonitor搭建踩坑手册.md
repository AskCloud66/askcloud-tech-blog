+++
title = "Gitmonitor 搭建踩坑手册"
date = '2024-12-28T00:00:00+08:00'
draft = false
description = "汇总 GitHub 代码泄露监控相关平台部署中的 Docker、MySQL 与配置要点。"
image = "images/article-banners/gitmonitor-deployment.jpg"
categories = ["工具汇总", "安全搭建"]
tags = ["Gitmonitor", "代码泄露监控", "Docker"]
+++

> 注：文中的账号、密码与 Token 示例均已改为占位符，部署时请替换为自定义值。

针对甲方公司内部需要关注研发人员上传公司代码到公共仓库的情况，网络上存在较多现成检测平台，但多数平台已经停止了维护，经过使用比较后，下述平台为目前使用效果较好的平台。

原始部署说明中有不少细节不够完整，因此这里补充了从零开始的环境准备、启动与使用过程，方便后续复用。

## 码小 6 平台

https://github.com/4x99/code6

项目地址：

[Github]: https://github.com/4x99/code6

### Docker 安装模式

使用系统：Ubuntu20.04

step1：Docker 安装

```bash
#安装https协议、CA证书、dirmngr

apt-get update

apt-get install -y apt-transport-https ca-certificates

apt-get install dirmngr

#因docker官方源地址较慢，故需要更换数据源

curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian/gpg | sudo apt-key add -

echo 'deb https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian/ buster stable' | sudo tee /etc/apt/sources.list.d/docker.list

#安装docker
apt-get update

apt-get install docker-ce
#如需要选择安装版本
apt-cache madison docker-ce
sudo apt-get install docker-ce=18.06.1~ce~3-0~debian

apt-get install docker-compose

# 启动 Docker 服务
systemctl start docker

# Docker 基础命令
#docker任务情况
docker ps

#docker删除所有容器
docker rm `docker ps -a -q`

# 删除所有镜像
docker rmi `docker images -q`

#查看docker状态
docker status

#查看docker版本
docker -v

#停止开始具体对应容器应用
docker stop/start/restart "容器ID"

#获取容器元数据
docker inspect "容器ID"
```

step2：MySQL 服务安装

贴士：根据实际测试情况，容器化 MySQL 与 MySQL 8.0 都出现过数据无法写入的问题，因此更推荐本地安装 MySQL 5.7。

本案例使用Ubuntu20.04，其余版本可参照进行安装

```bash
#安装MySQL5.7（password：<请替换为自定义密码>）
wget https://dev.mysql.com/get/mysql-apt-config_0.8.12-1_all.deb

dpkg -i mysql-apt-config_0.8.12-1_all.deb

#选择UBUNTU BIONIC / MySQL Server and Cluster screen /MYSQL-5.7

#列示MySQL版本
apt-cache policy mysql-server

#选择对应版本进行安装
apt-get install mysql-client=5.7.36-1ubuntu18.04

apt-get install -s mysql-community-server=5.7.36-1ubuntu18.04

apt-get install -s mysql-server=5.7.36-1ubuntu18.04

#如果安装过程中出现依赖错误
apt-get intall libmecab2

apt-get install libtinfo5

#如果安装错误，进行删除
rm /var/lib/mysql/ -R
rm /etc/mysql -R
apt-get autoremove mysql* --purge
apt-get remove apparmor
 #查看是否还存在依赖
 dpkg --list | grep mysql

```

根据code6地址的说明建立数据库信息

```bash
#进入数据库
mysql -u 'username' -p
-password

#查看现有数据库
show databases;

#创建实际使用单独数据库
create database code6;

#解决远程连接mysql连不上的问题
方法一:
#password为自己密码，username为用户名
GRANT ALL PRIVILEGES ON *.* TO 'username'@'%' IDENTIFIED BY 'password' WITH GRANT OPTION;

#刷新
flush privileges;

方法二：
#编辑配置文件
sudo vim /etc/mysql/my.cnf
```

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2772722/1626412351345-2a87277b-329d-4d98-af8d-93beac2fe6de.png)

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2772722/1626412360684-5d4c493a-7aa0-4444-b207-3d956898343c.png?x-oss-process=image%2Fresize%2Cw_634%2Climit_0)

```bash
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf

#重启服务
service mysql restart
```

step3：启动 code6 容器应用

```bash
#克隆代码
git clone https://github.com/4x99/code6.git

#创建镜像
cd code6
docker build -t code6 .

#启动容器
docker run -d \
-p 666:80 \
-e MYSQL_HOST=172.17.0.1 \ （容器网关地址，看实际情况替换）
-e MYSQL_PORT=3306 \
-e MYSQL_DATABASE=code6 \
-e MYSQL_USERNAME=xxx \
-e MYSQL_PASSWORD=xxxxxx \
--name code6-server code6

#创建用户
docker exec -it code6_server /bin/bash
php artisan code6:user-add <邮箱> <密码> （必须为邮箱地址，但不必为真实）

#删除查看用户
php artisan code6:user-list
php artisan code6:user-delete <邮箱>
```

step4：使用 code6

```bash
http://<宿主机 IP>:666

#配置GitHub token，所有选项可不选
方法一：
在个人中心Settings -> Developer settings -> Personal access tokens -> Generate new token，内容选项无需勾选生成令牌
方法二：
code6平台内令牌信息跳转

#维护升级（在code6目录下）
docker stop "containerID"
git pull
sudo docker build -t code6 .
sudo docker inspect code6-mysql |grep IPAddress (获取数据库容器的IP地址)
sudo docker run -d \
-p 666:8080 \
-e MYSQL_HOST=172.17.0.1 \
-e MYSQL_PORT=3306 \
-e MYSQL_DATABASE=code6 \
-e MYSQL_USERNAME=root \
-e MYSQL_PASSWORD=<请替换为自定义密码> \
--name  code6_server_2024  code6

#如需要删除老版本创建容器
docker rm "containerID"
#删除老的镜像
docker rmi "imageid"

mysqlname:root
mysqlpassword:<请替换为自定义密码>
```

## Hawkeye 搭建

https://github.com/0xbug/Hawkeye

部署环境为Ubuntu20.04

step1：docker环境安装参照上文进行

step2：mongodb安装

```bash
#从官方源安装mongodb
sudo apt-get install mongodb

#修改配置文件让容器能够访问
vi /etc/mongodb.conf
#修改网络配置
port = 27017
bindIP = 0.0.0.0

#验证容器连接mongodb的准确性
docker exec “CONTAINER ID” curl ip:27017
```

step3：Hawkeye安装

```bash
#docker部署
docker pull daocloud.io/0xbug/hawkeye
## mongodb 需认证(ip地址在该情况下为容器网关地址)
docker run -ti -p 80:80 -e MONGODB_URI=mongodb://"username":"password"@"ip":27017/hawkeye -e MONGODB_USER= -e MONGODB_PASSWORD= -d daocloud.io/0xbug/hawkeye
## mongodb 无认证
docker run -ti -p 80:80 -e MONGODB_URI=mongodb://"ip":27017 -d daocloud.io/0xbug/hawkeye
```

step4：使用

```bash
#特别注意事项
配置token
账号：tonken输入
密码：密码输入框先输入空格然后删除空格
点击添加
```

## VKSRC Git Monitor 部署

https://github.com/VKSRC/Github-Monitor

step1：docker部署参照上文

```bash
#需要安装docker-compose
sudo apt-get install docker-compose
```

step2：VKSRC安装

```bash
#克隆代码到本地
git clone https://github.com/VKSRC/Github-Monitor.git

#修改配置文件
mv .env.docker .env
#修改其中的Email Settings和initial Administrator配置。这两个配置分别控制邮件提醒，以及初始管理帐号密码
#注意: 如果需要访问的地址不是127.0.0.1或localhost, 需要修改ALLOWED_HOST参数,将访问地址加到里面，例如本机IP地址

#一键启动
docker-compose up -d

#如果需要修改端口
如果想修改启动端口，可以修改docker-compose.yaml文件中web容器的ports
默认为8001:80，比如要修改为8080端口可改为8080:80。
```
