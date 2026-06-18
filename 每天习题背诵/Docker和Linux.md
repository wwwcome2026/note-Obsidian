# Docker和Linux 相关知识：

## 1.Docker 镜像相关操作？

Docker pull 镜像名

Docker images 查看镜像

Docker save  -o  压缩包.tar  镜像名:tag     //导出镜像

Docker load -I 压缩包.tar      //导入镜像

Docker rmi   镜像名       //移除镜像

## 2.Docker 容器相关操作？

Docker run –name 容器名 -v 数据卷目录：/容器目录 -p 宿主机端口：容器端口 -d 镜像名：tag

Docker ps  查看正在运行的容器

Docker ps -a 查看所有容器

Docker logs -f 查看日志

Docker exec -it 容器名 bash    //进入一个正在运行的 Docker 容器，并启动一个交互式的 Bash 终端

## 3.Linux 相关指令操作？

Ps -ef | grep 进程名  ---强制查看所有并过滤进程

Kill -9  ----杀进程

Mkdir   -----创建文件夹

Touch  ------创建文件

mv     -------移动

cp      -------复制

cat     ---------查看全部

tail -f    --------动态查看

netstat  --------查看开放端口号

top   --------查看机器的性能
