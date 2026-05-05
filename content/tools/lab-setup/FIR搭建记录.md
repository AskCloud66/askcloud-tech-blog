+++
title = "FIR 搭建记录"
date = '2024-12-28T00:00:00+08:00'
draft = false
description = "记录 Fast Incident Response 平台的 Docker 与原生部署过程、排错路径和配置要点。"
image = "images/article-banners/fir-deployment.jpg"
categories = ["工具汇总", "安全搭建"]
tags = ["FIR", "应急响应", "Docker"]
+++

> 注：原始记录中的数据库口令等敏感示例已替换为占位符，本地临时截图链接已移除。

Fast Incident Response (FIR) 是一个网络安全事件管理平台，在设计时考虑了敏捷性与速度。其可以轻松创建、跟踪、报告网络安全应急事件并用于 CSIRT、CERT 与 SOC 等人员。

下载方式：

```
git clone https://github.com/certsocietegenerale/FIR.git
```

## 部署方式

使用 Docker 进行部署。

### 修改 docker-compose 配置文件

步骤一：如果需要对外访问，请将默认映射调整到 8000 端口。

步骤二：调整数据库 root 账号及应用账号的密码配置。

![image-20241128112806082](https://s2.loli.net/2024/11/28/7jMxVoJWdqc236w.png)

user：root

password：<请替换为自定义密码>

user：fir

password：<请替换为自定义密码>

### 调整 fir.env 文件

根据自身环境修改数据库连接信息。

![image-20241128113155200](https://s2.loli.net/2024/11/28/cKn6UA9wNXpr8Tb.png)

同时补充允许访问的 host 或域名。

随后启动 Docker 应用：

```
docker-compose up -d --build
```

常见报错示例

```
ERROR: The Compose file './docker-compose.yml' is invalid because:
Unsupported config option for networks: 'backend.fir'
Unsupported config option for services: 'fir_celery_beat'
Unsupported config option for volumes: 'mariadb-data
```

```
version: '3'

networks:
  backend.fir:

volumes:
  static-content:
  mariadb-data:

services:
  fir:
    image: fir:latest
    build:
      context: ../
      dockerfile: docker/Dockerfile
    entrypoint: /bin/sh
    command: -c "wait-for -t 10 fir_db:3306 && python manage.py makemigrations && python manage.py migrate && python manage.py loaddata incidents/fixtures/*.json && python manage.py collectstatic --no-input && python manage.py runserver 0.0.0.0:8000"
    container_name: fir
    hostname: fir
    depends_on:
      - fir_db
      - fir_redis
    env_file:
      - fir.env
    networks:
      backend.fir:
    ports:
      - 8000:8000
    expose:
      - 8000
    volumes:
      - /tmp/uploads:/app/uploads
      - static-content:/var/www/static

  fir_db:
    image: mariadb
    container_name: fir_db
    hostname: fir_db
    networks:
      backend.fir:
    expose:
      - 3306
    volumes:
      - mariadb-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: <请替换为自定义密码>
      MYSQL_DATABASE: fir
      MYSQL_USER: fir
      MYSQL_PASSWORD: <请替换为自定义密码>

  fir_redis:
    image: "redis:alpine"
    container_name: fir_redis
    hostname: fir_redis
    networks:
      backend.fir:
    expose:
      - 6379

  fir_celery_worker:
    image: fir:latest
    entrypoint: /bin/sh
    command: -c "wait-for -t 10 fir_redis:6379 && wait-for -t 30 fir:8000 -- celery -A fir_celery.celeryconf.celery_app worker -l debug"
    container_name: fir_celery_worker
    hostname: fir_celery_worker
    depends_on:
      - fir
      - fir_db
      - fir_redis
    env_file:
      - fir.env
    networks:
      backend.fir:

  fir_celery_beat:
    image: fir:latest
    entrypoint: /bin/sh
    command: -c "wait-for -t 10 fir_redis:6379 && wait-for -t 30 fir:8000 -- celery -A fir_celery.celeryconf.celery_app beat -l debug"
    container_name: fir_celery_beat
    hostname: fir_celery_beat
    depends_on:
      - fir
      - fir_db
      - fir_redis
    env_file:
      - fir.env
    networks:
      backend.fir:

  fir_web:
    image: nginx
    container_name: fir_web
    hostname: fir_web
    depends_on:
      - fir
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - static-content:/usr/share/nginx/html:ro
    ports:
      - 80:80
    networks:
      backend.fir:

  fir_fake_smtp:
    image: mailhog/mailhog
    container_name: fir_fake_smtp
    hostname: fir_fake_smtp
    networks:
      backend.fir:
```

在开头添加version后能够正常执行，但是因为网络问题报错，开始排错网络，docker的转发需要iptables进行转发

```
iptables -L -n -t nat
docker network ls
```

结果发现docker网络中存在null的网络模式，我们进行网络重置

```
docker network prune
```

成功恢复正常，注意还需要修改nginx.conf中的端口，如果你本身的服务存在80端口的情况，例如修改为8888，同时记得修改docker-compose中fir-web的nginx端口为8888:8888

![image-20241210182954482](https://s2.loli.net/2024/12/10/xZU8h3iAH1gdubW.png)

启动发现fir镜像构建的容器存在报错无法进行启动，我们查询日志，检查出错原因

```
docker logs 容器ID
```

发现缺少是pip安装过程中因为网络问题缺少了部分以来，报错显示缺少bleach，我们考虑网络原因下载到本地进行相应的安装

```
pip download bleach
cp bleach*.whl ../(到主目录下)
#在Dockerfile中添加修改内容

COPY . /app
COPY bleach*.whl /app/

RUN source venv/bin/activate && \
    pip install /app/bleach*.whl && \
    find . -name requirements.txt -exec pip install -r {} \; && \
    mv fir/config/installed_apps.txt.sample fir/config/installed_apps.txt && \
    deactivate

#重新构建
docker-compose build fir
docker-compose up -d fir

#在dockerfile中添加pip源来解决网络问题（方法二）因为docker安装的虚拟环境VM环境的pip源指定不会影响
ENV PIP_INDEX_URL=https://mirrors.cloud.tencent.com/pypi/simple

```

```
#进入容器
docker exec -it <nginx_container_name> /bin/sh-i

#修改数据库账号密码
ALTER USER 'root'@'localhost' IDENTIFIED BY 'toor';
ALTER USER 'fir'@'%' IDENTIFIED BY 'fir';
FLUSH PRIVILEGES;

#更新配置后重新启动容器
docker-compose down
docker-compose up -d
```

一开始会存在端口冲突，停止所有容器，优先重启FIR后，问题解决，但接下来又开始碰到问题

![image-20241212151002922](https://s2.loli.net/2024/12/12/74TUGlQOMjDoJ2x.png)

使用默认的账户登录存在以上问题

/fir/config/base.py

![image-20241212154822029](https://s2.loli.net/2024/12/12/Big7kXwSJn6CMx1.png)

composeprod.py

![image-20241212154847499](https://s2.loli.net/2024/12/12/NnIJbrkoZGyw2WD.png)

方法二:

必要组建安装

```
$ sudo apt update
$ sudo apt install libmysqlclient-dev gettext python3-dev python3-pip python3-lxml git libxml2-dev libxslt1-dev libz-dev nginx pkg-config python-is-python3 python3-virtualenv redis libsasl2-dev libldap2-dev
```

配置数据库

```
mysql -u root -p
> CREATE DATABASE fir;
> CREATE USER 'fir'@'localhost' IDENTIFIED BY '<请替换为自定义密码>';
> GRANT USAGE ON *.* TO 'fir'@'localhost';
> GRANT ALL PRIVILEGES ON `fir`.* TO 'fir'@'localhost';
```

安装步骤

步骤一：

创建一个文件夹，归属权限是www-data

```
$ sudo install -d -o www-data -g www-data -m 755 /opt/fir
$ sudo -u www-data bash
$ cd /opt/fir
```

步骤二：创建虚拟环境下载项目

```
$ virtualenv env-FIR
$ source env-FIR/bin/activate
$ git clone https://github.com/certsocietegenerale/FIR.git
```

步骤三：安装必要组件

```
$ cd FIR
$ find . -name requirements.txt -exec pip install -r {} \;
```

步骤四：配置config文件、配置数据库等

```
#调整allowhost、database参数等
$ cp fir/config/production.py.sample fir/config/production.py
#启用插件
$ cp fir/config/installed_apps.txt.sample fir/config/installed_apps.txt
#调整时区等（base.py）
TIME_ZONE字段
#数据库创建相关表
$ ./manage.py migrate --settings fir.config.production
#创建超级管理员
$ ./manage.py createsuperuser --settings fir.config.production
#导入初始数据
$ ./manage.py loaddata incidents/fixtures/01_seed_data.json --settings fir.config.production
#收集静态文件，缓存以获取性能
$ ./manage.py collectstatic --settings fir.config.production
#多语言支持
$ cd incidents
$ django-admin compilemessages
```

![image-20241128171145436](https://s2.loli.net/2024/11/28/f9DuRx4XZaJmKhr.png)

![image-20241128170358227](https://s2.loli.net/2024/11/28/8xkNSneEjavIcz7.png)

步骤五：配置服务server

安装uWSGI

```
pip install uwsgi
```

创建一个目录

```
$ sudo install -d -o www-data -g www-data -m 700 /run/fir
```

创建文件/etc/systemd/system/fir.service

```
[Unit]
Description=Fast Incident Response
After=syslog.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/fir/FIR
ExecStart=/opt/fir/env-FIR/bin/uwsgi --socket /run/fir/fir.sock --chdir /opt/fir/FIR --module fir.wsgi
Restart=always
KillSignal=SIGQUIT
Type=Debug
StandardError=syslog
NotifyAccess=All

[Install]
WantedBy=multi-user.target
```

启动应用

```
$ sudo systemctl daemon-reload
$ sudo systemctl start fir.service # start FIR
$ sudo systemctl enable fir.service # configure FIR to start automatically on boot
```

步骤六：配置nginx
