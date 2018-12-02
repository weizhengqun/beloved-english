# ssh 用法

在网络服务器开发过程中，经常要在远程主机上进行代码部署、运行、维护，而远程主机通常不在身旁，这就需要远程登陆。同时，有些服务器开发需要公网地址和第三方服务器交互，无法在本地直接调试，例如微信公众号服务器开发。如果代码调试每次都要在远程服务器上进行，效率会非常低。而ssh可以完成以下两种功能，帮助提高效率：   
1.远程登陆主机   
在本地登陆到远程主机，进行操作。  
2.远程端口转发   
把远程主机上的端口映射到本地端口，通过端口映射和第三方服务器交互，可以方便的在本地调试服务器程序，成熟后再部署到服务器上。  
当然ssh还可以完成其他操作，在这里我们只关注这两个功能。ssh包含一族命令，我们会在用到的时候介绍。   

## 远程登陆    
最简单的远程登陆用法是  
``` bash
ssh user@remoteIP
```
其中user是远程主机上的用户名，remoteIP是远程主机的ip地址。命令执行后会提示输入用户user密码，输入正确密码后进入远程主机，正常操作远程主机。但是这种简单的用法每次登陆都需要输入密码，很麻烦。可以配置ssh客户端使用密钥免密码登陆，设置步骤：  
1.生成密钥对
``` bash
ssh-keygen 
```
在生成密钥过程中会询问密钥存放文件，直接回车，还会提示输入密码，直接回车键两次就行。密钥对只需要生成一次，存放在～/.ssh/目录下。其中id_rsa文件是你的私钥，不要泄漏，id_rsa.pub文件是公钥，公钥是需要放到远程服务器上，本地私钥和远程主机公钥用于验证用户身份。公钥可以分发到多个远程主机上，用于验证用户身份。一些云服务器也会生成私钥用于登陆，比如亚马逊的aws云，这个私钥也要更名保存在～/.ssh/目录下，注意不要覆盖id_rsa文件。  
2.拷贝公钥到远程服务器  
``` bash
ssh-copy-id -i ~/.ssh/id_rsa.pub user@remoteIP    
```
执行命令后，会提示输入user用户密码，输入正确后，用户公钥会追加到远程主机user的～/.ssh/目录下的authorized_keys文件末尾。以后就可以输入 ssh user@remoteIP 免密码登陆远程主机了。如何使用的不是～/.ssh/id_rsa私钥登陆，那还需要输入私钥名字 ssh -i ～/.ssh/id_rsa.aws user@awsIP。  
3.ssh配置文件  
到上一步虽然可以免密码远程登陆了，但是还是要记住用户名和ip地址或者主机名、私钥文件名甚至端口，还是不方便。新建～/.ssh/config文件，把这些需要记住的信息写入这个配置文件，例如：
``` vi
Host tencent                       #助记符
    HostName 134.175.139.124      #远程主机ip地址
    Port 1688                    #远程主机sshd监听端口号，缺省22
    User ubuntu                    #远程主机用户名
    IdentityFile ~/.ssh/id_rsa.tencent    #私钥文件路径，缺省~/.ssh/id_rsa
Host github
    HostName github.com
    Port 22
    User git
    IdentityFile ~/.ssh/id_rsa
```
然后就可以直接输入ssh tencent就可以以ubuntu用户免密码登陆134.175.139.124主机，私钥文件是～/.ssh/id_rsa.tencent，远程主机sshd监听端口是1688。上面例子配置了两个远程主机的ssh设置。   

## 远程端口转发
1.服务器端配置 
远程登陆服务器，打开/etc/ssh/sshd_config文件，增加一行：  
``` vi
GatewayPorts yes
```
允许sshd端口转发。  
2.远程端口转发命令 
``` bash
ssh -R 80:localhost:8080 tencent
```
80是远程主机134.175.139.124上的端口，8080是本地端口。执行完本命令后，远程主机的端口80就会映射到本地端口8080。就可以方便的在本地调试服务器代码了。后台运行命令如下  
``` bash
ssh -NfR 80:localhost:8080 tencent
```

## 其他
1.文件拷贝  
在开发过程中经常有文件需要在本地和远程主机间拷贝，使用scp命令可以完成这个功能。scp 也是ssh 命令族一个命令。  
``` bash
scp ./test.txt tencent:~/
scp tencent:~/test.txt ./
```
第一个命令是把本地当前目录下的test.txt文件拷贝到tencent主机的用户目录下。而第二个命令则是反方向拷贝。  
2.git 使用ssh协议  
git 如果使用ssh 协议传输，也可以使用ssh config文件的助记符。
``` bash
git clonet tencent:~/work.git
```


## 实验
如果没有现成远程主机，可以参照  https://docs.docker.com/engine/examples/running_ssh_service/ ，生成一个Docker sshd image。生成好image后用这个命令运行：
``` bash
docker run -d -p 6000:22 -p 8000:8000 --name test_sshd eg_sshd
```
生成container，这个container就相当于远程主机。然后运行
``` bash
ssh -p 6000 root@localhost
```
输入密码screencast登陆远程主机。然后按照本文档的步骤进行免密码登陆设置。并把远程主机8000端口转发到本地7000端口。


