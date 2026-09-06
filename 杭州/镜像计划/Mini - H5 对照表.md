下面是可直接放进 Markdown 文档的版本喵。表格只放概要，详细差异放到对应标题下，方便跳转。

# Mini -> H5 功能对照表

## 目录

- [总览表](app://-/index.html#总览表)
- [首页](app://-/index.html#首页)
- [登录](app://-/index.html#登录)
- [实名认证](app://-/index.html#实名认证)
- [专病流程](app://-/index.html#专病流程)
- [问卷](app://-/index.html#问卷)
- [权益](app://-/index.html#权益)
- [预约与报名](app://-/index.html#预约与报名)
- [报告](app://-/index.html#报告)
- [家庭](app://-/index.html#家庭)
- [积分与我的](app://-/index.html#积分与我的)

## 总览表

| 模块      | 小程序页面                                                  | H5 路由                                                      | 是否已完成    | 风险等级 |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------ | ------------- | -------- |
| 首页      | `pages/index/index`                                         | `/home`                                                      | 基本完成      | 中       |
| 登录      | `pages/login/index`                                         | `/login`、`/register`、`/wechat/callback`、`/bind/mobile`    | 基本完成      | 中       |
| 实名认证  | `pages/real-name/index`                                     | `/real-name`                                                 | H5 功能更完整 | 高       |
| 专病流程  | `pages/specialty/*`                                         | `/specialties/:programId` 等                                 | 基本完成      | 高       |
| 问卷      | `pages/questionnaire/*`                                     | `/scale`、`/scale/questionnaire`、`/scale/access/:token`     | 基本完成      | 中       |
| 权益      | `pages/benefit/*`                                           | `/shortcut/benefit`、`/specialties/:programId/benefit-claim`、`benefit-view` | 基本完成      | 高       |
| 预约/报名 | `pages/appointment/index`、`pages/specialty/register/index` | `/appointment`、`/registration`                              | 基本完成      | 高       |
| 报告      | `pages/report/*`                                            | `/report`、`/report/access/:token`                           | 基本完成      | 高       |
| 家庭      | `pages/family/*`                                            | `/family`、`/family/create`、`/family/invite/:token` 等      | H5 覆盖更完整 | 高       |
| 积分/我的 | `pages/profile/index`、`pages/points/index`                 | `/profile`、`/points`                                        | 基本完成      | 中       |

## 首页

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/index/index`                                          |
| H5 路由    | `/home`                                                      |
| 接口       | `GET /public/specialty-programs`、`GET /user/bootstrap`、`GET /user/specialty-programs/my-participations` |
| 是否已完成 | 基本完成                                                     |
| 差异点     | H5 有底部导航和待办分流；需要确认快捷入口是否完全等价小程序，如健康管理、人脸 Demo 是否保留或替代。 |
| 风险等级   | 中                                                           |

## 登录

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/login/index`                                          |
| H5 路由    | `/login`、`/register`、`/wechat/callback`、`/bind/mobile`    |
| 接口       | 小程序：`/auth/patient/direct-login`、`/auth/patient/direct-mobile-login`；H5：`/auth/patient/h5/sms/login`、`/password/login`、`/wechat/exchange` |
| 是否已完成 | 基本完成                                                     |
| 差异点     | 小程序偏微信手机号授权；H5 支持短信、密码、注册、微信 OAuth、绑定手机号，链路更多。 |
| 风险等级   | 中                                                           |

## 实名认证

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/real-name/index`                                      |
| H5 路由    | `/real-name`                                                 |
| 接口       | `GET /user/real-name/detail`、`GET /user/real-name/config`、`POST /user/real-name/upload-image`、`POST /user/real-name/ocr`、`POST /user/real-name/submit`、`POST /user/face-verify/sessions` |
| 是否已完成 | H5 功能更完整                                                |
| 差异点     | 小程序主要是姓名身份证 + 人脸核验；H5 增加身份证 OCR、图片上传、冲突处理等。 |
| 风险等级   | 高                                                           |

## 专病流程

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/specialty/detail/index`、`pages/specialty/list/index`、`pages/specialty/register/index` |
| H5 路由    | `/specialties/:programId`、`/registration`、`/scale/questionnaire`、`/specialties/:programId/benefit-claim`、`/appointment`、`/report` |
| 接口       | `GET /public/specialty-programs/{programId}`、`GET /user/specialty-programs/{programId}/my-participation`、`POST /user/specialty-programs/{programId}/participations`、`POST /complete-module` |
| 是否已完成 | 基本完成                                                     |
| 差异点     | H5 无独立 `/specialties` 列表，当前重定向到 `/home`；模块分流逻辑集中在 H5 工具函数里。 |
| 风险等级   | 高                                                           |

## 问卷

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/questionnaire/index/index`、`result/index`、`access/index` |
| H5 路由    | `/scale/questionnaire`、`/scale`、`/scale/access/:token`     |
| 接口       | `GET /user/questionnaires/current`、`POST /user/questionnaires/current/submit`、`GET /user/questionnaires/results`、`GET /user/questionnaires/access-share/{shareToken}` |
| 是否已完成 | 基本完成                                                     |
| 差异点     | H5 有结果列表、授权入口和专病 `templateId` 参数支持；需回归专病提交后是否推进模块。 |
| 风险等级   | 中                                                           |

## 权益

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/benefit/index/index`、`claim/index`、`view/index`     |
| H5 路由    | `/shortcut/benefit`、`/specialties/:programId/benefit-claim`、`/specialties/:programId/benefit-view` |
| 接口       | `GET /benefit-claim`、`POST /complete-module`、`POST /esign-agreements/initiate`、`POST /esign-agreements/confirm` |
| 是否已完成 | 基本完成                                                     |
| 差异点     | 小程序有权益列表页；H5 用快捷状态页聚合后跳领取/查看。H5 协议、声明、e签逻辑较重。 |
| 风险等级   | 高                                                           |

## 预约与报名

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/appointment/index/index`、`pages/specialty/register/index` |
| H5 路由    | `/appointment`、`/registration`                              |
| 接口       | `GET /registration`、`POST /registration`、`GET /appointment`、`POST /appointment`、`PUT /appointment`、`GET /appointment/verification-code` |
| 是否已完成 | 基本完成                                                     |
| 差异点     | H5 用同一个 `AppointmentView.vue` 同时承载报名、预约、查看态、核验码，文件复杂度高。 |
| 风险等级   | 高                                                           |

## 报告

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/report/index/index`、`detail/index`                   |
| H5 路由    | `/report`、`/report/access/:token`                           |
| 接口       | `GET /reports`、`GET /reports/latest?reportType=AI_REPORT`、`REVIEW`、`EXAM_REPORT`、`GET /user/report-view-authorizations` |
| 是否已完成 | 基本完成                                                     |
| 差异点     | H5 报告页更偏聚合视图，并支持授权目录、分享授权、只读文档查看器。 |
| 风险等级   | 高                                                           |

## 家庭

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/family/index/index`、`create/index`、`invite/index`   |
| H5 路由    | `/family`、`/family/create`、`/family/invite/:token`、`/family/request/:id`、`/family/relation/:id`、`/family/face-verify` |
| 接口       | `GET /family/binding-relations`、`GET /family/binding-requests`、`POST /family/binding-requests`、`GET /family/invite-tokens/{token}`、`POST /accept`、`POST /identity`、`POST /agreement`、`POST /face-verify` |
| 是否已完成 | H5 覆盖更完整                                                |
| 差异点     | 小程序依赖微信转发卡片；H5 依赖公开邀请链接和微信 JS SDK 分享。邀请链路差异较大。 |
| 风险等级   | 高                                                           |

## 积分与我的

| 字段       | 内容                                                         |
| ---------- | ------------------------------------------------------------ |
| 小程序页面 | `pages/profile/index/index`、`pages/points/index/index`      |
| H5 路由    | `/profile`、`/points`                                        |
| 接口       | `GET /user/bootstrap`、`GET /api/user/points/account`、`GET /api/user/points/ledgers`、`POST /auth/patient/h5/password/change` |
| 是否已完成 | 基本完成                                                     |
| 差异点     | H5 我的页包含修改密码、我的服务入口；需要确认所有入口没有“迁移中”或死链。 |
| 风险等级   | 中                                                           |

## 建议下一步

先不要直接重构喵。建议你把这张表作为第一版，对每个模块补一列“验收结果”，然后按风险顺序跑：专病流程、预约报名、权益、报告、家庭。这样你的工作会从“我要重构”变成“我基于镜像差异做有证据的小重构”。