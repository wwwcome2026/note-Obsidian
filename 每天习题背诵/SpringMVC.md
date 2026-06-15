# Springmvc 相关知识：

## 1.什么是Spring MVC ？简单介绍下你对springMVC的理解

Spring MVC 是 Spring Framework 提供的一个基于 Java 的实现 MVC（Model-View-Controller）设计模式的请求驱动类型的轻量级 Web 框架

## 2.说说SpringMVC的执行流程？

2.1用户发送请求到前端控制器（DispatcherServlet）

2.2请求映射到处理器映射（HandlerMapping）

2.3调用处理器适配器(HandlerAdapter)

2.4调用处理器 (Handler) 处理业务

2.5调用视图解析器（ViewResolver）封装数据返回

## 3.说说你们项目中springmvc异常是如何处理的？
-
	1. 定义异常的类型（业务异常，系统异常，其它异常）
	2. 创建一个异常类使用@RestControllerAdvice注解
	3. @ExceptionHandler注解放在多个方法上去匹配各种异常类型

备注：springmvc 的异常处理本质是aop

## 4.Spring MVC如何接受和响应json格式数据？

@RequestBody 接参

@ResponseBody 响应

## 5.项目中用过到过拦截器【handlerInterceptor】吗？哪里用到过？如何实现的？

用户登录验证：

当用户请求一个需要登录后才能访问的页面或资源时，拦截器会首先检查用户是否已经登录。

如果用户未登录，拦截器会重定向用户到登录页面；
如果用户已登录，则放行请求到对应的Controller

具体：在用户登录访问后端服务时携带token ,拦截器会拦截token 判断token 是否失效或者并解析

## 8.说说SpringMVC中接受前端传递的请求参数的方式有哪些？

普通类型传参---→http:127.0.0.1:8080/user?name = zhangsan =====(String name)

Json 传参 -----→post 方式提交表单==========（@RequestBody User user）

Rest风格路径传参---→http:127.0.0.1:8080/user/{id}/{name}===（@Pathvariable Long id）

## 9.Springmvc 有哪些常用注解？

@Controller  @RestController  @RequestMapping  @RequestParam

@PathVariable @RequestBody
