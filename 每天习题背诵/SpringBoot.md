# Springboot相关知识：

## 1.Spring Boot的两大特征是什么？如何实现自动配置？

答：

1. 起步依赖

Springboot 工程 pom -----<parent> spring-boot-starter-parent ---→父工程定义了大量的依赖坐标,依赖坐标里包含了 我们项目中使用的 依赖。并且定义版本号，不会造成冲突

2. 自动配置

启动类@SpringBootApplication--→ @EnableAutoConfiguration--→ @Import--→bean对象选择器---→ META-INF/spring/*.import结尾文件(定义了大量的配置类，配置类包含所有的bean对象)

## 2.SpringBoot的常用注解有哪些？

@SpringBootApplication
@EnableAutoConfiguration
@Import
@Component
@Configuration
@Controller
@service

## 3.SpringBoot读取配置文件的方式有哪些？

第一种：@Value

第二种：@ConfigurationProperties

## 4.Spring Boot与Spring Cloud的关系是什么？

Springboot 是快速启动spring 框架的技术。Springcloud 是微服务框架。

两个没有任何关系。但是springcloud 微服务组件必须要结合springboot 的自动装配功能更合适
