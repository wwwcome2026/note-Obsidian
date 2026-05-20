# Springcloud 相关知识：

## 1.Springcloud主要的五大组件是什么？

答：注册中心组件，远程调用组件，负载均衡组件，网关组件，微服务保护组件

## 2.Springcloud是如何进行远程通信？原理是什么？

答：通过远程fegin 的调用。

原理：fegin 的本质是通过http 协议发送调用请求，满足几个要素（服务名称，请求方式，路径，参数）。服务调用者和提供者将服务注册到注册中心，通过服务名称去拉取服务下的多个实例，然后负载均衡去选择一个实例的ip \+ 端口去发起调用。

## 3.说下网关的作用？

答：路由的转发与负载均衡，身份认证和校验

## 4.说下网关具体路由怎么配置的？身份是怎么认证的？

gateway:

  routes:

    - id: order-service

    uri: lb://order-service  \#如果满足就走负载均衡去注册中心找这个服务名

    predicates:

    - Path=/order/**  \#判断是否满足url的路径规则

    - id: user-service

    uri: lb://userservice  \#如果满足就走负载均衡去注册中心找这个服务名

    predicates:

    - Path=/user/**  \#判断是否满足url的路径规则

    - After=2017-01-20T17:42:47.789-07:00\[America/Denver\]

    filters:

    - AddRequestHeader=name,blue

  default-filters:  \# 对所有请求或者响应做过滤

    - AddRequestHeader=name,blue

  globalcors: \# 全局的跨域处理

    add-to-simple-url-handler-mapping: true \# 解决options请求被拦截问题

    corsConfigurations:

    '\[/**\]':

    allowedOrigins: "*"\# 允许哪些网站的跨域请求

    allowedMethods: "*"\# 允许的跨域ajax的请求方式

    allowedHeaders: "*" \# 允许在请求中携带的头信息

    allowCredentials: true \# 是否允许携带cookie

    maxAge: 360000 \# 这次跨域检测的有效期

身份认证：创建一个类去实现GloableFilter 接口，在接口里编写校验的业务逻辑。如果有多个拦截器可以用@Order(-1) 注解来区分前后

## 5.nacos 的配置中心热更新有几种方式？

有两种方式：@RefreshScope\+@Value  ; @ConfigurationProperties

## 6.Springcloud 的版本使用的多少？

目前使用的版本是Hoxton.SR10，2021

## 7.springcloud 的常用注解

@EnableFeignClients  @SpringBootApplication  @EurekaServer  @Controller  @Service

@Value
