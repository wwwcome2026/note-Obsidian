# Docker和Linux 相关知识：

## 1.Docker 镜像相关操作？

docker pull 镜像名:tag      //拉取镜像

docker images              //查看镜像

docker save -o 压缩包.tar 镜像名:tag     //导出镜像

docker load -i 压缩包.tar      //导入镜像

docker rmi 镜像名:tag       //移除镜像

## 2.Docker 容器相关操作？

docker run --name 容器名 -v 数据卷目录:容器目录 -p 宿主机端口:容器端口 -d 镜像名:tag   
//容器启动命令，涵盖了命名、数据持久化、网络通信、后台运行四大关键配置。

docker ps              //查看正在运行的容器

docker ps -a           //查看所有容器

docker logs -f 容器名    //查看日志

docker exec -it 容器名 bash    //进入一个正在运行的 Docker 容器，并启动一个交互式的 Bash 终端

## 3.Linux 相关指令操作？

ps -ef | grep 进程名     //查看所有进程并过滤

kill -9 进程号        //强制杀进程

mkdir                 //创建文件夹

touch                 //创建文件

mv                    //移动/重命名

cp                    //复制

cat 文件名             //查看全部

tail -f 文件名         //动态查看

netstat               //查看开放端口号

top                   //查看机器的性能
