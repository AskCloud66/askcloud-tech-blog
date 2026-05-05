+++
title = "watchvuln 应用部署记录"
date = '2024-08-13T00:00:00+08:00'
draft = false
description = "记录 watchvuln 在 Docker 与二进制两种方式下的部署取舍与后台运行方法。"
image = "images/article-banners/watchvuln-deployment.jpg"
categories = ["工具汇总", "安全搭建"]
tags = ["watchvuln", "漏洞告警", "Docker"]
+++

> 注：文中的数据库连接串、Webhook Key 等敏感字段均已替换为占位符。

项目地址：

https://github.com/zema1/watchvuln

docker安装方法

采用dockers-compose安装

优先对项目进行git

```
git clone https://github.com/zema1/watchvuln.git
```

对docker-compose.yaml文件进行编辑

```yaml
version: '3'
services:
  watchvuln:
    restart: always
    image: zemal/watchvuln:latest
    environment:
      WECHATWORK_KEY: <your-wechatwork-key>
      DB_CONN: mysql://root:<请替换为自定义密码>@172.17.0.1:3306/watchvuln
      INTERVAL: 1h
      SOURCES: avd,ti,oscs,threatbook,struts2
      NO_FILTER: 'true'
      BLACKLIST_FILE: '/home/dev/watchvuln/blacklist.txt'
      ENABLE_CVE_FILTER: 'true'
      # depends_on:
            #  - mysql

        #  postgres:
        # restart: always
        #image: postgres:14.4-alpine
        # environment:
        #POSTGRES_DB: watchvuln
        #POSTGRES_USER: watchvuln
        #POSTGRES_PASSWORD: watchvuln
        #volumes:
        #- "./data/postgresql:/var/lib/postgresql/data"
```

曾尝试使用 PostgreSQL 作为数据库，但连接始终报错；结合排查结果，最终改为本地 MySQL 连接方式后可以正常启动。

如果使用企业微信推送，可直接将机器人 Hook 链接中的 key 写入配置项。

以上配置完成后任务虽然可以启动，但一直没有对新发现的漏洞进行告警。反复排查无果后，开始转向二进制方式运行。

优先尝试编写命令行

```bash
./watchvuln-linux-amd64 --wechatwork-key '<your-wechatwork-key>' --blacklist-file '/home/dev/watchvuln/blacklist.txt' --db-conn 'mysql://root:<请替换为自定义密码>@172.17.0.1:3306/watchvuln'  --interval '1h' --enable-cve-filter
```

运行后可以正常告警

因此补充一个后台运行脚本：

watchvuln.sh

```bash
#!/bin/bash

/home/dev/watchvuln/watchvuln-linux-amd64 \
  --wechatwork-key '<your-wechatwork-key>' \
  --blacklist-file '/home/dev/watchvuln/blacklist.txt' \
  --db-conn 'mysql://root:<请替换为自定义密码>@172.17.0.1:3306/watchvuln' \
  --interval '1h' \
  --enable-cve-filter
```

运行nohup命令，并指定log输出到watchvuln.log

```bash
nohup sh /home/dev/watchvuln/watchvuln.sh > watchvuln.log 2>&1 &
```

至此，整体部署流程完成。
